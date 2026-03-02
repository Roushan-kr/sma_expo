import { useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Svg, Rect, Text as SvgText, Line } from 'react-native-svg';
import { apiRequest } from '@/api/common/apiRequest';
import { useStableToken } from '@/hooks/useStableToken';
import type { MeterStatus } from '../dashboard';

// ─── Types (match Prisma schema exactly) ──────────────────────────────────────

interface MeterDetail {
  id: string;
  meterNumber: string;
  status: MeterStatus;
  consumerId: string;
  tariffId: string;
  // Latest reading included by API
  lastReading?: {
    consumption: number;
    voltage: number | null;
    current: number | null;
    timestamp: string;
  } | null;
}

/**
 * ConsumptionAggregate model fields:
 *   totalUnits, periodStart, periodEnd, granularity (HOURLY|DAILY|MONTHLY)
 */
interface ConsumptionAggregate {
  id: string;
  meterId: string;
  periodStart: string;
  periodEnd: string;
  granularity: 'HOURLY' | 'DAILY' | 'MONTHLY';
  totalUnits: number;
  maxDemand: number | null;
  avgVoltage: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    <View className={`px-3 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>{status}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-slate-700/50">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-slate-100 text-sm font-medium">{value}</Text>
    </View>
  );
}

// ─── SVG Bar Chart (react-native-svg) ────────────────────────────────────────

const CHART_W = 340;
const CHART_H = 180;
const PAD = { top: 12, right: 12, bottom: 36, left: 36 };
const innerW = CHART_W - PAD.left - PAD.right;
const innerH = CHART_H - PAD.top - PAD.bottom;

function ConsumptionBarChart({ data }: { data: { x: string; y: number }[] }) {
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const barW = innerW / data.length - 6;

  return (
    <View className="bg-slate-800 rounded-2xl p-3">
      <Svg width={CHART_W} height={CHART_H}>
        {/* Baseline */}
        <Line
          x1={PAD.left}
          y1={PAD.top + innerH}
          x2={PAD.left + innerW}
          y2={PAD.top + innerH}
          stroke="#475569"
          strokeWidth={1}
        />
        {/* Y-axis label */}
        <SvgText
          x={10}
          y={PAD.top + innerH / 2}
          fill="#64748b"
          fontSize={9}
          textAnchor="middle"
          rotation="-90"
          originX={10}
          originY={PAD.top + innerH / 2}
        >
          kWh
        </SvgText>

        {data.map((d, i) => {
          const barH = Math.max((d.y / maxY) * innerH, 2);
          const x = PAD.left + i * (innerW / data.length) + 3;
          const y = PAD.top + innerH - barH;
          return (
            <React.Fragment key={d.x}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill="#6366f1"
                opacity={0.9}
              />
              <SvgText
                x={x + barW / 2}
                y={CHART_H - 6}
                fill="#94a3b8"
                fontSize={9}
                textAnchor="middle"
              >
                {d.x}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────


export default function MeterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getToken = useStableToken();
  const router = useRouter();

  const [meter, setMeter] = useState<MeterDetail | null>(null);
  const [aggregates, setAggregates] = useState<ConsumptionAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch meter detail and last-7-days DAILY aggregates in parallel
      const [meterRes, aggRes] = await Promise.all([
        apiRequest<MeterDetail>(`/api/smart-meters/my-meters/${id}`, { headers }),
        apiRequest<ConsumptionAggregate[]>(
          `/api/smart-meters/my-meters/${id}/aggregates?granularity=DAILY&days=7`,
          { headers }
        ),
      ]);
      
      setMeter(meterRes.data);
      setAggregates(aggRes.data || []);
    } catch (err: any) {
      setError(
        err?.message ?? 'Failed to load meter data.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-3 text-sm">Loading meter…</Text>
      </View>
    );
  }

  if (error || !meter) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center gap-3 px-6">
        <Text className="text-red-400 text-sm text-center">{error ?? 'Meter not found.'}</Text>
        <Pressable className="bg-indigo-500 rounded-xl px-5 py-2.5" onPress={fetchData}>
          <Text className="text-white font-semibold text-sm">Retry</Text>
        </Pressable>
      </View>
    );
  }

  // Chart: x = periodStart date (MM/DD), y = totalUnits (kWh)
  const chartData = (Array.isArray(aggregates) ? aggregates : []).map((a) => ({
    x: new Date(a.periodStart).toLocaleDateString('en-IN', { month: '2-digit', day: '2-digit' }),
    y: a.totalUnits,
  }));

  const lastReading = meter.lastReading;

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 20 }}>
      {/* Back */}
      <Pressable className="mb-4" onPress={() => router.back()}>
        <Text className="text-indigo-400 font-medium">← Back</Text>
      </Pressable>

      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-slate-50">{meter.meterNumber}</Text>
        <StatusBadge status={meter.status} />
      </View>

      {/* Stats from latest MeterReading */}
      <View className="bg-slate-800 rounded-2xl px-4 mb-6">
        <InfoRow
          label="Last Reading"
          value={lastReading ? `${lastReading.consumption} kWh` : '—'}
        />
        <InfoRow
          label="Voltage"
          value={lastReading?.voltage != null ? `${lastReading.voltage} V` : '—'}
        />
        <InfoRow
          label="Current"
          value={lastReading?.current != null ? `${lastReading.current} A` : '—'}
        />
        {lastReading?.timestamp && (
          <InfoRow
            label="Recorded at"
            value={new Date(lastReading.timestamp).toLocaleString('en-IN')}
          />
        )}
      </View>

      {/* Consumption Chart — ConsumptionAggregate.totalUnits (DAILY) */}
      <Text className="text-slate-300 font-semibold text-base mb-3">
        Consumption — Last 7 Days (kWh)
      </Text>
      {chartData.length === 0 ? (
        <View className="bg-slate-800 rounded-2xl h-40 items-center justify-center">
          <Text className="text-slate-500 text-sm">No aggregation data available</Text>
        </View>
      ) : (
        <ConsumptionBarChart data={chartData} />
      )}

      {/* Billing link */}
      <Pressable
        className="mt-6 bg-indigo-500/15 border border-indigo-500/40 rounded-2xl p-4 flex-row items-center justify-between"
        onPress={() => router.push('/billing' as any)}
      >
        <View>
          <Text className="text-slate-50 font-semibold text-sm">Billing History</Text>
          <Text className="text-slate-400 text-xs mt-0.5">View & download reports</Text>
        </View>
        <Text className="text-indigo-400 text-lg">→</Text>
      </Pressable>
    </ScrollView>
  );
}
