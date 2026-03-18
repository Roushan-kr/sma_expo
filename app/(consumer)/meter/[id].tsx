import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { apiRequest } from "@/api/common/apiRequest";
import { useStableToken } from "@/hooks/useStableToken";
import type { MeterStatus } from "../dashboard";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  violet: "#7c3aed",
  blue: "#38bdf8",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

interface MeterDetail {
  id: string;
  meterNumber: string;
  status: MeterStatus;
  consumerId: string;
  tariffId: string;
  lastReading?: {
    consumption: number;
    voltage: number | null;
    current: number | null;
    timestamp: string;
  } | null;
}

interface ConsumptionAggregate {
  id: string;
  meterId: string;
  periodStart: string;
  periodEnd: string;
  granularity: string;
  totalUnits: number;
  maxDemand: number | null;
  avgVoltage: number | null;
}

const STATUS_CONFIG: Record<
  MeterStatus,
  { color: string; iconName: keyof typeof Ionicons.glyphMap }
> = {
  ACTIVE: { color: C.emerald, iconName: "checkmark-circle" },
  INACTIVE: { color: C.muted, iconName: "pause-circle" },
  FAULTY: { color: C.rose, iconName: "warning" },
  DISCONNECTED: { color: C.amber, iconName: "unlink-outline" as any },
};

function StatRow({
  label,
  value,
  iconName,
  accent,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accent?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.dim,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: `${accent ?? C.indigo}10`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={16} color={accent ?? C.indigo} />
        </View>
        <Text style={{ color: C.muted, fontSize: 14 }}>{label}</Text>
      </View>
      <Text style={{ color: C.text, fontSize: 14, fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );
}

function ConsumptionBarChart({ data }: { data: { x: string; y: number }[] }) {
  const W = 340;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 32, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const barW = (innerW / data.length) * 0.55;
  const gap = innerW / data.length;

  return (
    <Svg width={W} height={H}>
      {[0, 0.5, 1].map((t) => {
        const y = PAD.top + innerH * (1 - t);
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
        const barH = Math.max((d.y / maxY) * innerH, 3);
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const y = PAD.top + innerH - barH;
        const isMax = d.y === maxY;
        return (
          <React.Fragment key={d.x}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={5}
              fill={isMax ? C.indigo : C.blue}
              opacity={isMax ? 1 : 0.5}
            />
            <SvgText
              x={x + barW / 2}
              y={H - 8}
              fill={C.muted}
              fontSize={9}
              textAnchor="middle"
              fontWeight="600"
            >
              {d.x}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function MeterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getToken = useStableToken();
  const router = useRouter();

  const [meter, setMeter] = useState<MeterDetail | null>(null);
  const [aggregates, setAggregates] = useState<ConsumptionAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token missing");
        const headers = { Authorization: `Bearer ${token}` };
        const [meterRes, aggRes] = await Promise.all([
          apiRequest<MeterDetail>(`/api/smart-meters/my-meters/${id}`, {
            headers,
          }),
          apiRequest<ConsumptionAggregate[]>(
            `/api/smart-meters/my-meters/${id}/aggregates?granularity=DAILY&days=7`,
            { headers },
          ),
        ]);
        setMeter(meterRes.data);
        setAggregates(aggRes.data || []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load meter data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, getToken],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          Loading meter…
        </Animated.Text>
      </View>
    );
  }

  if (error || !meter) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            backgroundColor: "rgba(244,63,94,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="speedometer-outline" size={32} color={C.rose} />
        </View>
        <Text
          style={{
            color: C.rose,
            textAlign: "center",
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {error ?? "Meter not found."}
        </Text>
        <Pressable
          onPress={() => fetchData()}
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
    );
  }

  const cfg = STATUS_CONFIG[meter.status] ?? STATUS_CONFIG.INACTIVE;
  const lastReading = meter.lastReading;

  const chartData = (Array.isArray(aggregates) ? aggregates : []).map((a) => ({
    x: new Date(a.periodStart).toLocaleDateString("en-IN", {
      month: "2-digit",
      day: "2-digit",
    }),
    y: a.totalUnits,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={C.indigo}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{
            backgroundColor: C.surface,
            borderRadius: 22,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: C.dim,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: `${cfg.color}14`,
                  borderWidth: 1.5,
                  borderColor: `${cfg.color}30`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="speedometer" size={26} color={cfg.color} />
              </View>
              <View>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 22,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
                  {meter.meterNumber}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: `${cfg.color}14`,
                      borderRadius: 7,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Ionicons name={cfg.iconName} size={10} color={cfg.color} />
                    <Text
                      style={{
                        color: cfg.color,
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      {meter.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: C.dim }} />

          <StatRow
            label="Last Reading"
            value={lastReading ? `${lastReading.consumption} kWh` : "—"}
            iconName="flash-outline"
            accent={C.blue}
          />
          <StatRow
            label="Voltage"
            value={
              lastReading?.voltage != null ? `${lastReading.voltage} V` : "—"
            }
            iconName="pulse-outline"
            accent={C.amber}
          />
          <StatRow
            label="Current"
            value={
              lastReading?.current != null ? `${lastReading.current} A` : "—"
            }
            iconName="trending-up-outline"
            accent={C.emerald}
          />
          {lastReading?.timestamp && (
            <StatRow
              label="Recorded at"
              value={new Date(lastReading.timestamp).toLocaleString("en-IN")}
              iconName="time-outline"
            />
          )}
        </Animated.View>

        {/* Chart */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={{
            backgroundColor: C.surface,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: C.dim,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: "rgba(99,92,241,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bar-chart-outline" size={14} color={C.indigo} />
            </View>
            <Text
              style={{
                color: C.text,
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Last 7 Days (kWh)
            </Text>
          </View>
          {chartData.length === 0 ? (
            <View
              style={{
                height: 120,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bar-chart-outline" size={32} color={C.dim} />
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
                No aggregation data available
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <ConsumptionBarChart data={chartData} />
            </ScrollView>
          )}
        </Animated.View>

        {/* Billing CTA */}
        <Animated.View entering={FadeInUp.duration(500).delay(450)}>
          <Pressable
            onPress={() => router.push("/billing" as any)}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: "hidden",
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: C.indigo,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 10,
            })}
          >
            <LinearGradient
              colors={[C.indigo, C.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Ionicons name="receipt-outline" size={20} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Billing History
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
