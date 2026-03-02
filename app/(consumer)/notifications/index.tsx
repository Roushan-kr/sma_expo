import { useAuth } from '@clerk/clerk-expo';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '@/api/common/apiRequest';
import { useStableToken } from '@/hooks/useStableToken';

// ─── Types (match Prisma Notification exactly) ────────────────────────────────

interface Notification {
  id: string;
  consumerId: string;
  title: string;
  message: string;    
  type: string;
  isRead: boolean;   
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <Pressable
      className={`rounded-2xl p-4 mb-3 gap-1.5 ${
        notification.isRead
          ? 'bg-slate-800/60'
          : 'bg-slate-800 border border-indigo-500/30'
      }`}
      onPress={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text
          className={`text-sm font-semibold flex-1 ${
            notification.isRead ? 'text-slate-400' : 'text-slate-50'
          }`}
        >
          {notification.title}
        </Text>
        {!notification.isRead && (
          <View className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5" />
        )}
      </View>
      {/* 'message' is the correct field name from schema */}
      <Text className="text-slate-400 text-xs" numberOfLines={2}>
        {notification.message}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-slate-600 text-xs">
          {new Date(notification.createdAt).toLocaleString('en-IN')}
        </Text>
        {notification.type ? (
          <Text className="text-slate-600 text-xs">{notification.type}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const getToken = useStableToken();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Count by isRead (schema field)
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      const res = await apiRequest<any>('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const inner = res.data;
      const data: Notification[] = Array.isArray(inner)
        ? inner
        : Array.isArray(inner?.data)
          ? inner.data
          : [];
          
      setNotifications(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      await apiRequest(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  }, [getToken]);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      await apiRequest('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-slate-50">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-indigo-500 rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            className={markingAll ? 'opacity-50' : 'opacity-100'}
            onPress={markAllAsRead}
            disabled={markingAll}
          >
            <Text className="text-indigo-400 text-sm font-medium">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 px-5">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
            <Pressable className="bg-indigo-500 rounded-xl px-5 py-2.5" onPress={fetchNotifications}>
              <Text className="text-white font-semibold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-4xl">🔔</Text>
            <Text className="text-slate-300 font-semibold">All caught up!</Text>
            <Text className="text-slate-500 text-sm">No notifications yet.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard notification={item} onMarkRead={markAsRead} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
