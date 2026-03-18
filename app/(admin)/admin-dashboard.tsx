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
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import Svg, {
  Circle,
  G,
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  indigoLight: "#818cf8",
  violet: "#7c3aed",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  blue: "#38bdf8",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  iconName,
  onPress,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay)}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: pressed ? C.surface2 : C.surface,
          borderRadius: 20,
          padding: 18,
          marginHorizontal: 4,
          borderWidth: 1,
          borderColor: C.dim,
          borderLeftWidth: 3,
          borderLeftColor: accent,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${accent}14`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Ionicons name={iconName} size={20} color={accent} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: C.text,
            letterSpacing: -0.8,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: C.muted,
            marginTop: 2,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
        {sub ? (
          <Text
            style={{
              fontSize: 11,
              marginTop: 6,
              fontWeight: "700",
              color: accent,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────

function RevenueBarChart({
  data,
  color,
}: {
  data: { month: string; amount: number }[];
  color?: string;
}) {
  if (!data.length) return null;

  const W = 340;
  const H = 150;
  const PAD = { top: 16, bottom: 30, left: 8, right: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map((d) => d.amount), 1);
  const barW = (chartW / data.length) * 0.5;
  const gap = chartW / data.length;

  return (
    <Svg width={W} height={H}>
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
      {data.map((d, i) => {
        const barH = Math.max((d.amount / max) * chartH, 3);
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
              rx={6}
              fill={color ?? (isMax ? C.indigo : C.indigoLight)}
              opacity={isMax || color ? 1 : 0.5}
            />
            <SvgText
              x={x + barW / 2}
              y={H - 8}
              fontSize={9}
              fill={C.muted}
              textAnchor="middle"
              fontWeight="600"
            >
              {d.month}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Query Ring Chart ─────────────────────────────────────────────────────────

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
  const R = 50;
  const CX = 68;
  const CY = 68;
  const stroke = 16;
  const circumference = 2 * Math.PI * R;

  const segments = [
    { value: pending, color: C.amber, label: "Pending" },
    { value: aiReviewed, color: C.blue, label: "AI Reviewed" },
    { value: resolved, color: C.emerald, label: "Resolved" },
    { value: rejected, color: C.rose, label: "Rejected" },
  ];

  let cumulative = 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
      <Svg width={136} height={136}>
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={C.dim}
          strokeWidth={stroke}
          opacity={0.3}
        />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const offset = -cumulative * circumference;
          cumulative += frac;
          if (seg.value === 0) return null;
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
              strokeLinecap="round"
              rotation={-90}
              origin={`${CX},${CY}`}
            />
          );
        })}
        <SvgText
          x={CX}
          y={CY - 4}
          fontSize={22}
          fontWeight="800"
          fill={C.text}
          textAnchor="middle"
        >
          {total}
        </SvgText>
        <SvgText
          x={CX}
          y={CY + 14}
          fontSize={9}
          fill={C.muted}
          textAnchor="middle"
          fontWeight="600"
        >
          queries
        </SvgText>
      </Svg>

      <View style={{ flex: 1, gap: 10 }}>
        {segments.map((l) => (
          <View
            key={l.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: l.color,
              }}
            />
            <Text style={{ flex: 1, color: C.muted, fontSize: 13, fontWeight: "500" }}>
              {l.label}
            </Text>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: "700" }}>
              {l.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function ActionTile({
  iconName,
  label,
  badge,
  badgeColor,
  accent,
  onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  badgeColor?: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? C.surface2 : C.surface,
        borderRadius: 18,
        padding: 18,
        marginHorizontal: 4,
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: C.dim,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: `${accent}14`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={24} color={accent} />
        </View>
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -6,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5,
              backgroundColor: badgeColor ?? C.rose,
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{ color: C.text, fontSize: 13, fontWeight: "700", textAlign: "center" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  iconName,
  children,
  delay = 0,
}: {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay)}
      style={{
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: C.dim,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: "rgba(99,92,241,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={16} color={C.indigo} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
          {title}
        </Text>
      </View>
      {children}
    </Animated.View>
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
  const { role } = useAuthStore();

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
        const res = await apiRequest<AdminStats>("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n: number) =>
    n >= 1_00_000
      ? `₹${(n / 1_00_000).toFixed(1)}L`
      : n >= 1000
        ? `₹${(n / 1000).toFixed(1)}K`
        : `₹${n.toFixed(0)}`;

  // ── Loading ──
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
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
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={{ color: C.muted, fontSize: 13 }}
        >
          Loading dashboard…
        </Animated.Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
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
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: C.emerald,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                color: C.muted,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Admin Overview
            </Text>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: C.text,
              letterSpacing: -0.5,
            }}
          >
            Welcome, {user?.firstName ?? "Admin"}
          </Text>
        </Animated.View>

        {/* ── Error ── */}
        {error && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              marginHorizontal: 20,
              marginTop: 12,
              backgroundColor: "rgba(244,63,94,0.06)",
              borderWidth: 1,
              borderColor: "rgba(244,63,94,0.15)",
              borderRadius: 16,
              padding: 18,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <Ionicons name="alert-circle" size={20} color={C.rose} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.rose, fontSize: 14, lineHeight: 20 }}>
                {error}
              </Text>
              <Pressable
                onPress={() => load()}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? C.surface2 : C.surface,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  alignSelf: "flex-start",
                  marginTop: 10,
                })}
              >
                <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>
                  Retry
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {stats && (
          <>
            {/* ── Stat Row 1 ── */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 16 }}>
              <StatCard
                iconName="people-outline"
                label="Consumers"
                value={stats.totalConsumers}
                accent={C.blue}
                onPress={() => router.push("/admin-consumers" as any)}
                delay={200}
              />
              <StatCard
                iconName="flash-outline"
                label="Active Meters"
                value={stats.activeMeters}
                sub={`of ${stats.totalMeters} total`}
                accent={C.emerald}
                onPress={() => router.push("/admin-meters?status=ACTIVE" as any)}
                delay={280}
              />
            </View>

            {/* ── Stat Row 2 ── */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 8 }}>
              {hasPermission(role, Permission.BILLING_READ) && (
                <StatCard
                  iconName="wallet-outline"
                  label="Total Revenue"
                  value={fmt(stats.totalRevenue)}
                  accent={C.indigo}
                  onPress={() => router.push("/admin-billing")}
                  delay={360}
                />
              )}
              {hasPermission(role, Permission.QUERY_MANAGE) && (
                <StatCard
                  iconName="notifications-outline"
                  label="Pending Queries"
                  value={stats.pendingQueries}
                  sub={stats.pendingQueries > 0 ? "Needs attention" : "All clear ✓"}
                  accent={stats.pendingQueries > 0 ? C.amber : C.emerald}
                  onPress={() => router.push("/admin-queries")}
                  delay={440}
                />
              )}
            </View>

            {/* ── Revenue Chart ── */}
            {hasPermission(role, Permission.BILLING_READ) && (
              <ChartCard
                title="Monthly Revenue"
                iconName="bar-chart-outline"
                delay={520}
              >
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
              </ChartCard>
            )}

            {/* ── Consumption Chart ── */}
            <ChartCard
              title="Consumption Trend (kWh)"
              iconName="trending-up-outline"
              delay={600}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <RevenueBarChart
                  data={
                    stats.monthlyStats?.map((s) => ({
                      month: s.month,
                      amount: s.consumption,
                    })) ?? []
                  }
                  color={C.emerald}
                />
              </ScrollView>
            </ChartCard>

            {/* ── Query Ring ── */}
            {hasPermission(role, Permission.QUERY_MANAGE) && (
              <ChartCard
                title="Query Breakdown"
                iconName="pie-chart-outline"
                delay={680}
              >
                <QueryRingChart
                  pending={stats.pendingQueries}
                  aiReviewed={stats.aiReviewedQueries}
                  resolved={stats.resolvedQueries}
                  rejected={stats.rejectedQueries}
                />
              </ChartCard>
            )}

            {/* ── Quick Actions ── */}
            <Animated.View
              entering={FadeInUp.duration(500).delay(760)}
              style={{ paddingHorizontal: 20, marginTop: 20 }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 12,
                }}
              >
                Quick Actions
              </Text>
              <View style={{ flexDirection: "row" }}>
                {hasPermission(role, Permission.QUERY_MANAGE) && (
                  <ActionTile
                    iconName="chatbubbles-outline"
                    label="Queries"
                    badge={stats.pendingQueries}
                    badgeColor={C.amber}
                    accent={C.amber}
                    onPress={() => router.push("/admin-queries" as any)}
                  />
                )}
                {hasPermission(role, Permission.BILLING_READ) && (
                  <ActionTile
                    iconName="receipt-outline"
                    label="Billing"
                    accent={C.indigo}
                    onPress={() => router.push("/admin-billing" as any)}
                  />
                )}
                <ActionTile
                  iconName="speedometer-outline"
                  label="Meters"
                  accent={C.blue}
                  onPress={() => router.push("/admin-meters" as any)}
                />
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}