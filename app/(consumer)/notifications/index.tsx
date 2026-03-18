import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  blue: "#38bdf8",
  emerald: "#22c55e",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

interface Notification {
  id: string;
  consumerId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function NotificationCard({
  notification,
  onMarkRead,
  index = 0,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  index?: number;
}) {
  const isUnread = !notification.isRead;

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(80 + index * 35)}>
      <Pressable
        onPress={() => isUnread && onMarkRead(notification.id)}
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? C.surface2
            : isUnread
              ? C.surface
              : `${C.surface}99`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isUnread ? "rgba(99,92,241,0.2)" : C.dim,
          borderLeftWidth: isUnread ? 3 : 1,
          borderLeftColor: isUnread ? C.indigo : C.dim,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: isUnread ? 1 : 0.7,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: isUnread
                ? "rgba(99,92,241,0.1)"
                : "rgba(94,116,144,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={isUnread ? C.indigo : C.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: isUnread ? C.text : C.muted,
                  fontSize: 15,
                  fontWeight: "700",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {notification.title}
              </Text>
              {isUnread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: C.indigo,
                  }}
                />
              )}
            </View>
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                lineHeight: 20,
                marginBottom: 8,
              }}
              numberOfLines={2}
            >
              {notification.message}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Ionicons name="calendar-outline" size={11} color={C.dim} />
                <Text style={{ color: C.dim, fontSize: 11 }}>
                  {new Date(notification.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {notification.type && (
                <View
                  style={{
                    backgroundColor: C.surface2,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {notification.type}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const getToken = useStableToken();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");
      const res = await apiRequest<any>("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inner = res.data;
      setNotifications(
        Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [],
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token missing");
        await apiRequest(`/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
      }
    },
    [getToken],
  );

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: C.text,
              letterSpacing: -0.5,
            }}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: C.indigo,
                borderRadius: 10,
                minWidth: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 7,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            disabled={markingAll}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: pressed ? C.surface2 : C.surface,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: C.dim,
              opacity: markingAll ? 0.5 : 1,
            })}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={C.indigo}
            />
            <Text style={{ color: C.indigo, fontSize: 12, fontWeight: "700" }}>
              Read all
            </Text>
          </Pressable>
        )}
      </Animated.View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View entering={ZoomIn.springify()}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 20,
                  backgroundColor: "rgba(99,92,241,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(99,92,241,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <ActivityIndicator size="large" color={C.indigo} />
              </View>
            </Animated.View>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Ionicons
              name="notifications-off-outline"
              size={40}
              color={C.dim}
            />
            <Text style={{ color: C.rose, fontSize: 14, textAlign: "center" }}>
              {error}
            </Text>
            <Pressable
              onPress={fetchNotifications}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 14,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: C.dim,
              })}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "rgba(56,189,248,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={40} color={C.dim} />
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
              All caught up!
            </Text>
            <Text style={{ color: C.muted, fontSize: 13 }}>
              No notifications yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <NotificationCard
                notification={item}
                onMarkRead={markAsRead}
                index={index}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
