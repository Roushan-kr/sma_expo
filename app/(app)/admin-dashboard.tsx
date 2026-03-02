/**
 * Admin Dashboard — Overview
 * SuperAdmin / StateAdmin / BoardAdmin
 *
 * Sections:
 *  1. Stat cards  (consumers, queries, billing revenue)
 *  2. SVG bar chart (monthly revenue, last 6 months)
 *  3. Query status ring chart
 *  4. Quick actions → Queries | Billing
 */
import { useUser } from '@clerk/clerk-expo';
import { useStableToken } from '@/hooks/useStableToken';
import { useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { api } from '@/lib/api';
import { ROLE_TYPE } from '@/types/api.types';
import { useRoleGuard } from '@/hooks/useRoleGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalConsumers: number;
  totalMeters: number;
  activeMeters: number;
  totalRevenue: number;
  pendingQueries: number;
  resolvedQueries: number;
  aiReviewedQueries: number;
  rejectedQueries: number;
  monthlyRevenue: { month: string; amount: number }[];
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#273549',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#475569',
};

// ─── Mini stat card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 4,
        borderLeftWidth: 3,
        borderLeftColor: accent,
      }}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '800',
          color: C.text,
          marginTop: 8,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '600' }}>
        {label}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 10, color: accent, marginTop: 4, fontWeight: '700' }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

// ─── SVG Bar chart — monthly revenue ─────────────────────────────────────────

function RevenueBarChart({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  if (!data.length) return null;

  const W = 340;
  const H = 140;
  const PAD = { top: 12, bottom: 28, left: 8, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d.amount), 1);
  const barW = (chartW / data.length) * 0.55;
  const gap = chartW / data.length;

  return (
    <Svg width={W} height={H}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + chartH * (1 - t);
        return (
          <Line
            key={t}
            x1={PAD.left}
            y1={y}
            x2={W - PAD.right}
            y2={y}
            stroke={C.dim}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max((d.amount / max) * chartH, 2);
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const y = PAD.top + chartH - barH;
        const isMax = d.amount === max;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={5}
              fill={isMax ? C.indigo : C.indigoLight}
              opacity={isMax ? 1 : 0.55}
            />
            <SvgText
              x={x + barW / 2}
              y={H - 6}
              fontSize={9}
              fill={C.muted}
              textAnchor="middle"
            >
              {d.month}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── SVG Ring chart — query status ───────────────────────────────────────────

function QueryRingChart({
  pending,
  aiReviewed,
  resolved,
  rejected,
}: {
  pending: number;
  aiReviewed: number;
  resolved: number;
  rejected: number;
}) {
  const total = pending + aiReviewed + resolved + rejected || 1;
  const R = 48;
  const CX = 64;
  const CY = 64;
  const stroke = 18;
  const circumference = 2 * Math.PI * R;

  const segments = [
    { value: pending, color: C.amber },
    { value: aiReviewed, color: C.blue },
    { value: resolved, color: C.emerald },
    { value: rejected, color: C.rose },
  ];

  let cumulative = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Svg width={128} height={128}>
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const offset = -cumulative * circumference;
          cumulative += frac;
          return (
            <Circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              rotation={-90}
              origin={`${CX},${CY}`}
            />
          );
        })}
        <SvgText x={CX} y={CY - 6} fontSize={18} fontWeight="800" fill={C.text} textAnchor="middle">
          {total}
        </SvgText>
        <SvgText x={CX} y={CY + 10} fontSize={9} fill={C.muted} textAnchor="middle">
          total
        </SvgText>
      </Svg>

      {/* Legend */}
      <View style={{ gap: 8, flex: 1 }}>
        {[
          { label: 'Pending', value: pending, color: C.amber },
          { label: 'AI Reviewed', value: aiReviewed, color: C.blue },
          { label: 'Resolved', value: resolved, color: C.emerald },
          { label: 'Rejected', value: rejected, color: C.rose },
        ].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: l.color,
              }}
            />
            <Text style={{ fontSize: 12, color: C.muted, flex: 1 }}>{l.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{l.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Quick-action tile ────────────────────────────────────────────────────────

function ActionTile({
  icon,
  label,
  badge,
  badgeColor,
  onPress,
}: {
  icon: string;
  label: string;
  badge?: number;
  badgeColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? C.surface2 : C.surface,
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 4,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: C.dim + '44',
      })}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      {badge !== undefined && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: badgeColor ?? C.rose,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{badge}</Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  useRoleGuard([ROLE_TYPE.SUPER_ADMIN, ROLE_TYPE.STATE_ADMIN, ROLE_TYPE.BOARD_ADMIN, ROLE_TYPE.SUPPORT_AGENT, ROLE_TYPE.AUDITOR]);

  const getToken = useStableToken();
  const { user } = useUser();
  const router = useRouter();
  const navigation: any = useNavigation();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [consumersRes, metersRes, queriesRes, billingRes] = await Promise.allSettled([
        api.get<{ data: any[]; pagination: { total: number } }>('/api/consumers', { headers }),
        api.get<any[]>('/api/smart-meters', { headers }),
        api.get<{ data: any[] }>('/api/queries', { headers }),
        api.get<{ data: any[] }>('/api/billing', { headers }),
      ]);

      // Backend wraps all responses as { success, data: T }
      // Paginated endpoints wrap further: { success, data: { data: [], pagination: {} } }
      // Helper: safely pull out the inner array from either shape
      const unwrapArray = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.data)) return raw.data;    // paginated: { data: [], pagination }
        if (raw && Array.isArray(raw.data?.data)) return raw.data.data; // double-wrapped
        return [];
      };

      const consumers    = consumersRes.status === 'fulfilled' ? consumersRes.value.data : null;
      const metersRaw    = metersRes.status  === 'fulfilled'   ? (metersRes.value.data as any) : null;
      const queriesRaw   = queriesRes.status === 'fulfilled'   ? (queriesRes.value.data as any) : null;
      const billingRaw   = billingRes.status === 'fulfilled'   ? (billingRes.value.data as any) : null;

      const queriesData = unwrapArray(queriesRaw);
      const billingData = unwrapArray(billingRaw);

      const totalConsumers = (consumers as any)?.pagination?.total
        ?? (consumers as any)?.data?.pagination?.total
        ?? unwrapArray(consumers).length;
      const metersArr   = unwrapArray(metersRaw);
      const activeMeters = metersArr.filter((m: any) => m.status === 'ACTIVE').length;


      const pending = queriesData.filter((q: any) => q.status === 'PENDING').length;
      const aiReviewed = queriesData.filter((q: any) => q.status === 'AI_REVIEWED').length;
      const resolved = queriesData.filter((q: any) => q.status === 'RESOLVED').length;
      const rejected = queriesData.filter((q: any) => q.status === 'REJECTED').length;

      const totalRevenue = billingData.reduce((s: number, b: any) => s + (b.totalAmount ?? 0), 0);

      // Build last-6-month buckets
      const now = new Date();
      const buckets: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
          month: d.toLocaleString('en-IN', { month: 'short' }),
          amount: 0,
        });
      }
      billingData.forEach((b: any) => {
        const dt = new Date(b.generatedAt ?? b.billingEnd);
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          if (dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth()) {
            buckets[5 - i].amount += b.totalAmount ?? 0;
          }
        }
      });

      setStats({
        totalConsumers,
        totalMeters: metersArr.length,
        activeMeters,
        totalRevenue,
        pendingQueries: pending,
        resolvedQueries: resolved,
        aiReviewedQueries: aiReviewed,
        rejectedQueries: rejected,
        monthlyRevenue: buckets,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // getToken is stable from useStableToken

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) =>
    n >= 1_00_000
      ? `₹${(n / 1_00_000).toFixed(1)}L`
      : n >= 1000
        ? `₹${(n / 1000).toFixed(1)}K`
        : `₹${n.toFixed(0)}`;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.indigo} />
        <Text style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.indigo}
          />
        }
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600', letterSpacing: 0.5 }}>
            ADMIN OVERVIEW
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Pressable onPress={() => navigation.openDrawer()} style={{ padding: 4, marginLeft: -4, marginRight: 8 }}>
              <Text style={{ color: C.text, fontSize: 24 }}>☰</Text>
            </Pressable>
            <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>
              Welcome, {user?.firstName ?? 'Admin'} 👋
            </Text>
          </View>
        </View>

        {error ? (
          <View style={{ marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 16, padding: 16, marginTop: 8 }}>
            <Text style={{ color: '#f87171', fontSize: 13 }}>{error}</Text>
            <Pressable
              onPress={() => load()}
              style={{ marginTop: 10, backgroundColor: C.indigo, borderRadius: 10, padding: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {stats ? (
          <>
            {/* ── Stat row 1 ── */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 16 }}>
              <StatCard
                icon="👥"
                label="Consumers"
                value={stats.totalConsumers}
                accent={C.blue}
              />
              <StatCard
                icon="⚡"
                label="Active Meters"
                value={stats.activeMeters}
                sub={`of ${stats.totalMeters} total`}
                accent={C.emerald}
              />
            </View>

            {/* ── Stat row 2 ── */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 8 }}>
              <StatCard
                icon="💰"
                label="Total Revenue"
                value={fmt(stats.totalRevenue)}
                accent={C.indigo}
              />
              <StatCard
                icon="🔔"
                label="Pending Queries"
                value={stats.pendingQueries}
                sub={stats.pendingQueries > 0 ? 'Needs attention' : 'All clear ✓'}
                accent={stats.pendingQueries > 0 ? C.amber : C.emerald}
              />
            </View>

            {/* ── Revenue chart ── */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 20,
                backgroundColor: C.surface,
                borderRadius: 20,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 }}>
                Monthly Revenue
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <RevenueBarChart data={stats.monthlyRevenue} />
              </ScrollView>
              <Text style={{ fontSize: 10, color: C.dim, textAlign: 'right', marginTop: 4 }}>
                Last 6 months
              </Text>
            </View>

            {/* ── Query ring ── */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 12,
                backgroundColor: C.surface,
                borderRadius: 20,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>
                Query Breakdown
              </Text>
              <QueryRingChart
                pending={stats.pendingQueries}
                aiReviewed={stats.aiReviewedQueries}
                resolved={stats.resolvedQueries}
                rejected={stats.rejectedQueries}
              />
            </View>

            {/* ── Quick actions ── */}
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: C.muted,
                  letterSpacing: 0.5,
                  marginBottom: 10,
                  paddingHorizontal: 4,
                }}
              >
                QUICK ACTIONS
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <ActionTile
                  icon="💬"
                  label="Queries"
                  badge={stats.pendingQueries}
                  badgeColor={C.amber}
                  onPress={() => router.push('/(app)/admin-queries')}
                />
                <ActionTile
                  icon="🧾"
                  label="Billing"
                  onPress={() => router.push('/(app)/admin-billing')}
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
