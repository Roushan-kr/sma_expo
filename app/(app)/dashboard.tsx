import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { api } from '@/lib/api';

// ─── Types (matches Prisma SmartMeter model) ───────────────────────────────────

export type MeterStatus = 'ACTIVE' | 'INACTIVE' | 'FAULTY' | 'DISCONNECTED';

export interface SmartMeter {
  id: string;
  meterNumber: string;
  status: MeterStatus;
  consumerId: string;
  tariffId: string;
  createdAt: string;
  updatedAt: string;
  // Included via API relation (latest MeterReading)
  lastReading?: {
    consumption: number;
    timestamp: string;
    voltage?: number | null;
    current?: number | null;
  } | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<MeterStatus, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  FAULTY: 'bg-red-500/20 text-red-400',
  DISCONNECTED: 'bg-amber-500/20 text-amber-400',
};

function StatusBadge({ status }: { status: MeterStatus }) {
  const cls = STATUS_BADGE[status] ?? 'bg-slate-500/20 text-slate-400';
  const [bg, fg] = cls.split(' ');
  return (
    <View className={`px-2.5 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>{status}</Text>
    </View>
  );
}

function MeterCard({
  meter,
  onPress,
}: {
  meter: SmartMeter;
  onPress: () => void;
}) {
  const lastKwh = meter.lastReading?.consumption;
  return (
    <Pressable
      className="bg-slate-800 rounded-2xl p-4 mb-3 gap-2 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-slate-50 font-semibold text-base">
          {meter.meterNumber}
        </Text>
        <StatusBadge status={meter.status} />
      </View>
      <Text className="text-slate-400 text-sm">
        Last reading:{' '}
        <Text className="text-slate-200 font-medium">
          {lastKwh !== undefined && lastKwh !== null
            ? `${lastKwh} kWh`
            : '—'}
        </Text>
      </Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { signOut, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [meters, setMeters] = useState<SmartMeter[]>([]);
  const [metersLoading, setMetersLoading] = useState(true);
  const [metersError, setMetersError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const fetchMeters = useCallback(async () => {
    setMetersLoading(true);
    setMetersError(null);
    try {
      const token = await getToken();
      const { data } = await api.get<SmartMeter[]>('/api/smart-meters', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeters(data);
    } catch (err: any) {
      setMetersError(
        err?.response?.data?.message ?? err?.message ?? 'Failed to load meters.'
      );
    } finally {
      setMetersLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) fetchMeters();
  }, [isLoaded, fetchMeters]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } finally {
      setSigningOut(false);
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Consumer uses phoneNumber (not phone)
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View>
          <Text className="text-slate-400 text-sm">Signed in as</Text>
          <Text className="text-slate-50 font-semibold text-base">{phone}</Text>
        </View>
        <Pressable
          className={`border border-indigo-600 rounded-xl px-4 py-2 ${signingOut ? 'opacity-50' : 'opacity-100'}`}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {signingOut ? (
            <ActivityIndicator color="#6366f1" size="small" />
          ) : (
            <Text className="text-indigo-400 font-semibold text-sm">Sign Out</Text>
          )}
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-2xl font-bold text-slate-50">My Smart Meters</Text>
      </View>

      <View className="flex-1 px-5">
        {metersLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-400 mt-3 text-sm">Loading meters…</Text>
          </View>
        ) : metersError ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-red-400 text-sm text-center">{metersError}</Text>
            <Pressable
              className="bg-indigo-500 rounded-xl px-5 py-2.5"
              onPress={fetchMeters}
            >
              <Text className="text-white font-semibold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : meters.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-4xl">🔌</Text>
            <Text className="text-slate-300 font-semibold text-base">
              No meters found
            </Text>
            <Text className="text-slate-500 text-sm text-center">
              No smart meters are linked to your account yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={meters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MeterCard
                meter={item}
                onPress={() => router.push(`/(app)/meter/${item.id}`)}
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
