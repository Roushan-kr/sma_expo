import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { Path, Circle as SvgCircle, Line } from "react-native-svg";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, Consumer, SmartMeter } from "@/types/api.types";

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

interface BillingReport {
  id: string;
  totalAmount: number;
  billingEnd: string;
}

interface SupportQuery {
  id: string;
  queryText: string;
  status: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; iconName: keyof typeof Ionicons.glyphMap }
> = {
  ACTIVE: { color: C.emerald, iconName: "checkmark-circle" },
  INACTIVE: { color: C.muted, iconName: "pause-circle" },
  FAULTY: { color: C.rose, iconName: "warning" },
  DISCONNECTED: { color: C.amber, iconName: "unlink-outline" as any },
  PENDING: { color: C.amber, iconName: "time-outline" },
  RESOLVED: { color: C.emerald, iconName: "checkmark-circle-outline" },
  REJECTED: { color: C.rose, iconName: "close-circle-outline" },
  AI_REVIEWED: { color: C.blue, iconName: "sparkles-outline" },
};

function SectionHeader({
  title,
  iconName,
  count,
  delay = 0,
}: {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  count?: number;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 4,
          height: 18,
          borderRadius: 2,
          backgroundColor: C.indigo,
        }}
      />
      <Ionicons name={iconName} size={16} color={C.indigo} />
      <Text style={{ flex: 1, color: C.text, fontSize: 16, fontWeight: "700" }}>
        {title}
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: C.surface2,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "700" }}>
            {count}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function EmptyCard({
  message,
  iconName,
}: {
  message: string;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 28,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.dim,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: "rgba(56,189,248,0.06)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={iconName} size={24} color={C.dim} />
      </View>
      <Text style={{ color: C.muted, fontSize: 14 }}>{message}</Text>
    </View>
  );
}

export default function ConsumerDetailScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getToken = useStableToken();

  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [meters, setMeters] = useState<SmartMeter[]>([]);
  const [bills, setBills] = useState<BillingReport[]>([]);
  const [queries, setQueries] = useState<SupportQuery[]>([]);
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
        const [userRes, meterRes, billRes, queryRes] = await Promise.all([
          apiRequest<Consumer>(`/api/consumers/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest<SmartMeter[]>(`/api/smart-meters/consumer/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest<any>(`/api/billing?consumerId=${id}&limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest<any>(`/api/support?consumerId=${id}&limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setConsumer(userRes.data);
        setMeters(meterRes.data || []);
        setBills(
          Array.isArray(billRes.data) ? billRes.data : billRes.data.data || [],
        );
        setQueries(
          Array.isArray(queryRes.data)
            ? queryRes.data
            : queryRes.data.data || [],
        );
      } catch (e: any) {
        setError(e?.message ?? "Failed to load consumer details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, getToken],
  );

  useEffect(() => {
    load();
  }, [load]);

  // ── Trend Graph ──
  const renderTrendGraph = () => {
    if (bills.length < 2) return null;
    const data = [...bills].reverse().map((b) => b.totalAmount);
    const max = Math.max(...data, 100);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 300;
    const height = 80;
    const stepX = width / (data.length - 1);

    const pathD = data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - 8 - ((val - min) / range) * (height - 16);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return (
      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
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
            <Ionicons name="trending-up-outline" size={14} color={C.indigo} />
          </View>
          <Text
            style={{
              color: C.muted,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Billing Trend
          </Text>
        </View>
        <Svg width={width} height={height}>
          {/* grid lines */}
          {[0, 0.5, 1].map((t) => {
            const y = 8 + (height - 16) * (1 - t);
            return (
              <Line
                key={t}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={C.dim}
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
            );
          })}
          {/* area fill */}
          <Path d={areaD} fill="rgba(99,92,241,0.08)" />
          {/* line */}
          <Path
            d={pathD}
            fill="none"
            stroke={C.indigo}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* dots */}
          {data.map((val, i) => {
            const x = i * stepX;
            const y = height - 8 - ((val - min) / range) * (height - 16);
            return (
              <SvgCircle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill={C.indigo}
                stroke={C.bg}
                strokeWidth="2"
              />
            );
          })}
        </Svg>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Text style={{ color: C.dim, fontSize: 10 }}>Past</Text>
          <Text style={{ color: C.dim, fontSize: 10 }}>Recent</Text>
        </View>
      </Animated.View>
    );
  };

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
          Loading consumer…
        </Animated.Text>
      </View>
    );
  }

  // ── Error ──
  if (error || !consumer) {
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
          <Ionicons name="person-outline" size={32} color={C.rose} />
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
          {error || "Consumer not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.surface2 : C.surface,
            borderRadius: 14,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: C.dim,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          })}
        >
          <Ionicons name="arrow-back" size={16} color={C.text} />
          <Text style={{ color: C.text, fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.indigo}
          />
        }
      >
        {/* ── Profile Card ── */}
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
              gap: 16,
              marginBottom: 20,
            }}
          >
            <LinearGradient
              colors={[C.indigo, C.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>
                {consumer.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.3,
                }}
              >
                {consumer.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(56,189,248,0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(56,189,248,0.2)",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      color: C.blue,
                      fontSize: 10,
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    Consumer
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* divider */}
          <View
            style={{
              height: 1,
              backgroundColor: C.dim,
              marginBottom: 18,
            }}
          />

          {/* info rows */}
          {[
            {
              iconName: "call-outline" as const,
              label: "Phone",
              value: consumer.phoneNumber,
            },
            {
              iconName: "location-outline" as const,
              label: "Address",
              value: consumer.address,
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: "rgba(99,92,241,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <Ionicons name={item.iconName} size={16} color={C.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 3,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 14,
                    fontWeight: "500",
                    lineHeight: 20,
                  }}
                >
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── Trend Graph ── */}
        {renderTrendGraph()}

        {/* ── Meters ── */}
        <SectionHeader
          title="Assigned Meters"
          iconName="speedometer-outline"
          count={meters.length}
          delay={500}
        />
        {meters.length === 0 ? (
          <EmptyCard
            message="No meters assigned"
            iconName="speedometer-outline"
          />
        ) : (
          meters.map((meter, idx) => {
            const cfg = STATUS_CONFIG[meter.status] ?? {
              color: C.muted,
              iconName: "ellipse" as any,
            };
            return (
              <Animated.View
                key={meter.id}
                entering={FadeInDown.duration(350).delay(550 + idx * 50)}
              >
                <Pressable
                  onPress={() => router.push(`/admin-meter/${meter.id}` as any)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? C.surface2 : C.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.dim,
                    borderLeftWidth: 3,
                    borderLeftColor: cfg.color,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: `${cfg.color}14`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name="speedometer-outline"
                      size={18}
                      color={cfg.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: C.text,
                        fontSize: 15,
                        fontWeight: "700",
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
                      <Ionicons
                        name={cfg.iconName}
                        size={10}
                        color={cfg.color}
                      />
                      <Text
                        style={{
                          color: cfg.color,
                          fontSize: 10,
                          fontWeight: "800",
                          textTransform: "uppercase",
                        }}
                      >
                        {meter.status}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: C.surface2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={C.muted}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}

        {/* ── Bills ── */}
        <View style={{ marginTop: 20 }}>
          <SectionHeader
            title="Recent Bills"
            iconName="receipt-outline"
            count={bills.length}
            delay={650}
          />
          {bills.length === 0 ? (
            <EmptyCard
              message="No bills generated yet"
              iconName="receipt-outline"
            />
          ) : (
            bills.map((bill, idx) => (
              <Animated.View
                key={bill.id}
                entering={FadeInDown.duration(350).delay(700 + idx * 50)}
              >
                <View
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.dim,
                    borderLeftWidth: 3,
                    borderLeftColor: C.indigo,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "rgba(99,92,241,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={18}
                      color={C.indigo}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: C.text,
                        fontSize: 18,
                        fontWeight: "800",
                        letterSpacing: -0.3,
                      }}
                    >
                      ₹{bill.totalAmount.toLocaleString()}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 4,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color={C.muted}
                      />
                      <Text
                        style={{
                          color: C.muted,
                          fontSize: 12,
                        }}
                      >
                        {new Date(bill.billingEnd).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="receipt-outline" size={18} color={C.dim} />
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* ── Support Queries ── */}
        <View style={{ marginTop: 20 }}>
          <SectionHeader
            title="Support Tickets"
            iconName="chatbubbles-outline"
            count={queries.length}
            delay={800}
          />
          {queries.length === 0 ? (
            <EmptyCard
              message="No support queries found"
              iconName="chatbubbles-outline"
            />
          ) : (
            queries.map((q, idx) => {
              const cfg = STATUS_CONFIG[q.status] ?? {
                color: C.muted,
                iconName: "ellipse" as any,
              };
              return (
                <Animated.View
                  key={q.id}
                  entering={FadeInDown.duration(350).delay(850 + idx * 50)}
                >
                  <Pressable
                    onPress={() => router.push(`/admin-query/${q.id}` as any)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? C.surface2 : C.surface,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: C.dim,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: C.text,
                          fontSize: 14,
                          fontWeight: "600",
                          flex: 1,
                          marginRight: 12,
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {q.queryText}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: `${cfg.color}14`,
                          borderWidth: 1,
                          borderColor: `${cfg.color}25`,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Ionicons
                          name={cfg.iconName}
                          size={10}
                          color={cfg.color}
                        />
                        <Text
                          style={{
                            color: cfg.color,
                            fontSize: 10,
                            fontWeight: "800",
                          }}
                        >
                          {q.status}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color={C.dim}
                      />
                      <Text style={{ color: C.dim, fontSize: 11 }}>
                        Submitted{" "}
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
