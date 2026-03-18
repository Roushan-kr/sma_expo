import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useStableToken } from '@/hooks/useStableToken';
import { useMeterStore } from '@/stores/useMeterStore';
import { useRoleGuard } from '@/hooks/useRoleGuard';


// ─── Types (matches Prisma SmartMeter model + relations) ─────────────────────

export type MeterStatus = 'ACTIVE' | 'INACTIVE' | 'FAULTY' | 'DISCONNECTED';

export interface SmartMeter {
  id: string;
  meterNumber: string;
  status: MeterStatus;
  consumerId?: string;
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

import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';

function MeterConsumptionChart({ consumption = 0 }: { consumption: number }) {
  // A tiny decorative bar chart since we only have `lastReading.consumption` 
  // in the summary view (unless we fetch /aggregates per meter, which is heavy).
  // We'll just show a visual representation of the current consumption vs a baseline.
  const baseline = 20; // assumed avg daily
  const max = Math.max(consumption, baseline * 1.5, 10);
  const W = 100;
  const H = 40;
  const barW = (consumption / max) * W;
  const baseW = (baseline / max) * W;

  return (
    <View className="mt-2 mb-1">
      <Text className="text-[10px] text-slate-500 mb-1 rounded font-medium uppercase tracking-wider">
        Current Usage vs Avg
      </Text>
      <Svg width={W} height={H} className="rounded-lg overflow-hidden">
        {/* Baseline marker */}
        <Line x1={baseW} y1={0} x2={baseW} y2={H} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
        
        {/* Consumption bar */}
        <Rect x={0} y={H / 4} width={barW} height={H / 2} fill="#6366f1" rx={4} />
      </Svg>
    </View>
  );
}

function MeterCard({
  meter,
  onPress,
}: {
  meter: SmartMeter & { tariff?: any }; // Extend type to include tariff
  onPress: () => void;
}) {
  const lastKwh = meter.lastReading?.consumption;
  const tariff = meter.tariff;

  return (
    <Pressable
      className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden mb-4 active:opacity-80"
      onPress={onPress}
    >
      {/* Header: Meter Number & Status */}
      <View className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            METER
          </Text>
          <Text className="text-slate-50 font-mono text-lg font-bold">
            {meter.meterNumber}
          </Text>
        </View>
        <StatusBadge status={meter.status} />
      </View>

      {/* Body: Stats, Graph, Tariff */}
      <View className="p-4">
        <View className="flex-row justify-between items-end mb-4">
          <View>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
              Latest Reading
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-black text-indigo-400">
                {lastKwh !== undefined && lastKwh !== null ? lastKwh : '—'}
              </Text>
              <Text className="text-xs font-semibold text-slate-500">kWh</Text>
            </View>
          </View>
          
          {/* Decorative mini-chart based on lastKwh */}
          {lastKwh !== undefined && lastKwh !== null && (
             <MeterConsumptionChart consumption={lastKwh} />
          )}
        </View>

        {/* Tariff Details */}
        {tariff ? (
          <View className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/30 w-full mt-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Plan</Text>
              <Text className="text-xs text-slate-300 font-bold">{tariff.type}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[11px] text-slate-400 font-medium tracking-wide">Unit Rate: <Text className="font-bold text-slate-200">₹{tariff.unitRate}</Text></Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <Text className="text-[11px] text-slate-400 font-medium tracking-wide">Fixed: <Text className="font-bold text-slate-200">₹{tariff.fixedCharge}</Text></Text>
              </View>
            </View>
          </View>
        ) : (
          <Text className="text-[11px] text-slate-500 italic mt-2">No active tariff plan assigned</Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  useRoleGuard(['CONSUMER']);

  const { signOut, isLoaded } = useAuth();
  const getToken = useStableToken();
  const { user } = useUser();
  const router = useRouter();
  const navigation: any = useNavigation();

  const { meters, loading: metersLoading, error: metersError, loadMeters } = useMeterStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    if (isLoaded) {
      getToken().then((token) => {
        if (active && token) loadMeters(token);
      });
    }
    return () => { active = false; };
  }, [isLoaded, getToken, loadMeters]);

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
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? user?.primaryEmailAddress?.emailAddress ?? 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-slate-400 text-sm">Signed in as</Text>
            <Text className="text-slate-50 font-semibold text-base">{phone}</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            className="border border-indigo-600 rounded-xl px-4 py-2"
            onPress={() => router.push({
              pathname: '/dashboard' as any,
              params: { tab: 'profile' },
            })}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Text className="text-indigo-400 font-semibold text-sm">
              Profile
            </Text>
          </Pressable>
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
              <Text className="text-indigo-400 font-semibold text-sm">
                Sign Out
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-2xl font-bold text-slate-50">
          My Smart Meters
        </Text>
      </View>

      <View className="flex-1 px-5">
        {metersLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-400 mt-3 text-sm">Loading meters…</Text>
          </View>
        ) : metersError ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-red-400 text-sm text-center">
              {metersError}
            </Text>
            <Pressable
              className="bg-indigo-500 rounded-xl px-5 py-2.5"
              onPress={() => {
                getToken().then(t => { if (t) loadMeters(t); });
              }}
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
                onPress={() => router.push(`/meter/${item.id}` as any)}
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
