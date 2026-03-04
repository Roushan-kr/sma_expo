/**
 * Admin Dashboard — Overview
 * SuperAdmin / StateAdmin / BoardAdmin
 */
import { useUser } from "@clerk/clerk-expo";
import { useStableToken } from "@/hooks/useStableToken";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Permission, hasPermission } from "@/constants/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0f172a",
  surface: "#1e293b",
  surface2: "#273549",
  indigo: "#6366f1",
  indigoLight: "#818cf8",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  blue: "#3b82f6",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#475569",
};

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
  monthlyRevenue?: { month: string; amount: number }[];
  monthlyStats?: { month: string; revenue: number; consumption: number }[];
  queryDistribution?: Record<string, number>;
}

// ─── Mini stat card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  onPress,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-[20px] p-4 mt-1 mx-1 border-l-[3px] bg-surface"
      style={({ pressed }) => ({
        backgroundColor: pressed ? COLORS.surface2 : COLORS.surface,
        borderLeftColor: accent,
      })}
    >
      <Text className="text-[22px]">{icon}</Text>
      <Text className="text-[22px] font-extrabold text-text mt-2 tracking-tighter">
        {value}
      </Text>
      <Text className="text-[11px] text-muted mt-0.5 font-semibold">
        {label}
      </Text>
      {sub ? (
        <Text className="text-[10px] mt-1 font-bold" style={{ color: accent }}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ─── SVG Bar chart — monthly revenue ─────────────────────────────────────────

function RevenueBarChart({
  data,
  color,
}: {
  data: { month: string; amount: number }[];
  color?: string;
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
            stroke={COLORS.dim}
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
              fill={color ?? (isMax ? COLORS.indigo : COLORS.indigoLight)}
              opacity={isMax || color ? 1 : 0.55}
            />
            <SvgText
              x={x + barW / 2}
              y={H - 6}
              fontSize={9}
              fill={COLORS.muted}
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
    { value: pending, color: COLORS.amber },
    { value: aiReviewed, color: COLORS.blue },
    { value: resolved, color: COLORS.emerald },
    { value: rejected, color: COLORS.rose },
  ];

  let cumulative = 0;

  return (
    <View className="flex-row items-center space-x-4">
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
        <SvgText
          x={CX}
          y={CY - 6}
          fontSize={18}
          fontWeight="800"
          fill={COLORS.text}
          textAnchor="middle"
        >
          {total}
        </SvgText>
        <SvgText
          x={CX}
          y={CY + 10}
          fontSize={9}
          fill={COLORS.muted}
          textAnchor="middle"
        >
          total
        </SvgText>
      </Svg>

      {/* Legend */}
      <View className="flex-1 space-y-2">
        {[
          { label: "Pending", value: pending, color: COLORS.amber },
          { label: "AI Reviewed", value: aiReviewed, color: COLORS.blue },
          { label: "Resolved", value: resolved, color: COLORS.emerald },
          { label: "Rejected", value: rejected, color: COLORS.rose },
        ].map((l) => (
          <View key={l.label} className="flex-row items-center space-x-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            <Text className="text-xs text-muted flex-1">{l.label}</Text>
            <Text className="text-[13px] font-bold text-text">{l.value}</Text>
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
      className="flex-1 bg-surface rounded-[20px] p-[18px] mx-1 items-center space-y-2 border border-dim/10"
      style={({ pressed }) => ({
        backgroundColor: pressed ? COLORS.surface2 : COLORS.surface,
      })}
    >
      <Text className="text-[28px]">{icon}</Text>
      {badge !== undefined && badge > 0 ? (
        <View
          className="absolute top-3 right-3 rounded-full min-w-[20px] h-5 items-center justify-center px-1"
          style={{ backgroundColor: badgeColor ?? COLORS.rose }}
        >
          <Text className="text-[10px] font-extrabold text-white">{badge}</Text>
        </View>
      ) : null}
      <Text className="text-[13px] font-bold text-text text-center">
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
    ROLE_TYPE.SUPPORT_AGENT,
    ROLE_TYPE.AUDITOR,
  ]);

  const getToken = useStableToken();
  const { user } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const res = await apiRequest<AdminStats>("/api/dashboard/stats", {
          headers,
        });
        setStats(res.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    load();
  }, [load]);

  const { role } = useAuthStore();

  const fmt = (n: number) =>
    n >= 1_00_000
      ? `₹${(n / 1_00_000).toFixed(1)}L`
      : n >= 1000
        ? `₹${(n / 1000).toFixed(1)}K`
        : `₹${n.toFixed(0)}`;

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-muted mt-3 text-sm">Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#6366f1"
          />
        }
      >
        {/* ── Header ── */}
        <View className="px-5 pt-5 pb-2">
          <Text className="text-[13px] text-muted font-bold tracking-wider uppercase">
            Admin Overview
          </Text>
          <Text className="text-[26px] font-extrabold text-text mt-0.5">
            Welcome, {user?.firstName ?? "Admin"} 👋
          </Text>
        </View>

        {error ? (
          <View className="mx-5 bg-surface rounded-2xl p-4 mt-2">
            <Text className="text-rose text-[13px]">{error}</Text>
            <Pressable
              onPress={() => load()}
              className="mt-2.5 bg-indigo rounded-xl p-2.5 items-center"
            >
              <Text className="text-white font-bold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {stats ? (
          <>
            {/* ── Stat row 1 ── */}
            <View className="flex-row px-4 mt-4">
              <StatCard
                icon="👥"
                label="Consumers"
                value={stats.totalConsumers}
                accent="#3b82f6"
                onPress={() => router.push("/admin-consumers" as any)}
              />
              <StatCard
                icon="⚡"
                label="Active Meters"
                value={stats.activeMeters}
                sub={`of ${stats.totalMeters} total`}
                accent="#10b981"
                onPress={() =>
                  router.push("/admin-meters?status=ACTIVE" as any)
                }
              />
            </View>

            {/* ── Stat row 2 ── */}
            <View className="flex-row px-4 mt-2">
              {hasPermission(role, Permission.BILLING_READ) && (
                <StatCard
                  icon="💰"
                  label="Total Revenue"
                  value={fmt(stats.totalRevenue)}
                  accent="#6366f1"
                  onPress={() => router.push("/admin-billing")}
                />
              )}
              {hasPermission(role, Permission.QUERY_MANAGE) && (
                <StatCard
                  icon="🔔"
                  label="Pending Queries"
                  value={stats.pendingQueries}
                  sub={
                    stats.pendingQueries > 0 ? "Needs attention" : "All clear ✓"
                  }
                  accent={stats.pendingQueries > 0 ? "#f59e0b" : "#10b981"}
                  onPress={() => router.push("/admin-queries")}
                />
              )}
            </View>

            {/* ── Charts Section ── */}
            {hasPermission(role, Permission.BILLING_READ) && (
              <View className="mx-5 mt-5 bg-surface rounded-[20px] p-4 shadow-sm">
                <Text className="text-[15px] font-bold text-text mb-3">
                  Monthly Revenue
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <RevenueBarChart
                    data={
                      stats.monthlyStats?.map((s) => ({
                        month: s.month,
                        amount: s.revenue,
                      })) ??
                      stats.monthlyRevenue ??
                      []
                    }
                  />
                </ScrollView>
              </View>
            )}

            <View className="mx-5 mt-3 bg-surface rounded-[20px] p-4 shadow-sm">
              <Text className="text-[15px] font-bold text-text mb-3">
                Consumption Trend (Units)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <RevenueBarChart
                  data={
                    stats.monthlyStats?.map((s) => ({
                      month: s.month,
                      amount: s.consumption,
                    })) ?? []
                  }
                  color="#10b981"
                />
              </ScrollView>
            </View>

            {/* ── Query ring ── */}
            {hasPermission(role, Permission.QUERY_MANAGE) && (
              <View className="mx-5 mt-3 bg-surface rounded-[20px] p-4 shadow-sm">
                <Text className="text-[15px] font-bold text-text mb-3.5">
                  Query Breakdown
                </Text>
                <QueryRingChart
                  pending={stats.pendingQueries}
                  aiReviewed={stats.aiReviewedQueries}
                  resolved={stats.resolvedQueries}
                  rejected={stats.rejectedQueries}
                />
              </View>
            )}

            {/* ── Quick actions ── */}
            <View className="px-5 mt-5">
              <Text className="text-[13px] font-bold text-muted tracking-wider uppercase mb-2.5">
                Quick Actions
              </Text>
              <View className="flex-row">
                {hasPermission(role, Permission.QUERY_MANAGE) && (
                  <ActionTile
                    icon="💬"
                    label="Queries"
                    badge={stats.pendingQueries}
                    badgeColor="#f59e0b"
                    onPress={() => router.push("/admin-queries" as any)}
                  />
                )}
                {hasPermission(role, Permission.BILLING_READ) && (
                  <ActionTile
                    icon="🧾"
                    label="Billing"
                    onPress={() => router.push("/admin-billing" as any)}
                  />
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
