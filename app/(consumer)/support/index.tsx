import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import Svg, { Rect, Line } from "react-native-svg";
import { useStableToken } from "@/hooks/useStableToken";
import { useMeterStore } from "@/stores/useMeterStore";
import { useRoleGuard } from "@/hooks/useRoleGuard";

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

export type MeterStatus = "ACTIVE" | "INACTIVE" | "FAULTY" | "DISCONNECTED";

export interface SmartMeter {
  id: string;
  meterNumber: string;
  status: MeterStatus;
  consumerId?: string;
  tariffId: string;
  createdAt: string;
  updatedAt: string;
  lastReading?: {
    consumption: number;
    timestamp: string;
    voltage?: number | null;
    current?: number | null;
  } | null;
  tariff?: any;
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

function MiniChart({ consumption = 0 }: { consumption: number }) {
  const baseline = 20;
  const max = Math.max(consumption, baseline * 1.5, 10);
  const W = 100;
  const H = 36;
  const barW = Math.max((consumption / max) * W, 4);
  const baseX = (baseline / max) * W;

  return (
    <View>
      <Text
        style={{
          color: C.dim,
          fontSize: 9,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        Usage vs Avg
      </Text>
      <Svg width={W} height={H}>
        <Line
          x1={baseX}
          y1={0}
          x2={baseX}
          y2={H}
          stroke={C.amber}
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <Rect
          x={0}
          y={H / 4}
          width={barW}
          height={H / 2}
          fill={C.indigo}
          rx={4}
        />
      </Svg>
    </View>
  );
}

function MeterCard({
  meter,
  onPress,
  index = 0,
}: {
  meter: SmartMeter;
  onPress: () => void;
  index?: number;
}) {
  const lastKwh = meter.lastReading?.consumption;
  const tariff = meter.tariff;
  const cfg = STATUS_CONFIG[meter.status] ?? STATUS_CONFIG.INACTIVE;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(150 + index * 60)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? C.surface2 : C.surface,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 14,
          borderWidth: 1,
          borderColor: C.dim,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: C.dim,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${cfg.color}14`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="speedometer-outline" size={20} color={cfg.color} />
            </View>
            <View>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 2,
                }}
              >
                Meter
              </Text>
              <Text
                style={{
                  color: C.text,
                  fontSize: 17,
                  fontWeight: "800",
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                {meter.meterNumber}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: `${cfg.color}14`,
              borderWidth: 1,
              borderColor: `${cfg.color}25`,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Ionicons name={cfg.iconName} size={12} color={cfg.color} />
            <Text
              style={{
                color: cfg.color,
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              {meter.status}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={{ padding: 18 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                Latest Reading
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "800",
                    color: C.indigo,
                    letterSpacing: -1,
                  }}
                >
                  {lastKwh !== undefined && lastKwh !== null
                    ? lastKwh.toFixed(1)
                    : "—"}
                </Text>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  kWh
                </Text>
              </View>
            </View>
            {lastKwh !== undefined && lastKwh !== null && (
              <MiniChart consumption={lastKwh} />
            )}
          </View>

          {/* Tariff */}
          {tariff ? (
            <View
              style={{
                backgroundColor: C.surface2,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: C.dim,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="pricetag-outline" size={12} color={C.muted} />
                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    Plan
                  </Text>
                </View>
                <Text
                  style={{ color: C.text, fontSize: 13, fontWeight: "700" }}
                >
                  {tariff.type}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.emerald,
                    }}
                  />
                  <Text style={{ color: C.muted, fontSize: 11 }}>
                    Unit:{" "}
                    <Text
                      style={{ color: C.text, fontWeight: "700" }}
                    >
                      ₹{tariff.unitRate}
                    </Text>
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.amber,
                    }}
                  />
                  <Text style={{ color: C.muted, fontSize: 11 }}>
                    Fixed:{" "}
                    <Text
                      style={{ color: C.text, fontWeight: "700" }}
                    >
                      ₹{tariff.fixedCharge}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <Ionicons name="alert-circle-outline" size={14} color={C.dim} />
              <Text style={{ color: C.dim, fontSize: 12, fontStyle: "italic" }}>
                No active tariff plan
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  useRoleGuard(["CONSUMER"]);

  const { signOut, isLoaded } = useAuth();
  const getToken = useStableToken();
  const { user } = useUser();
  const router = useRouter();

  const {
    meters,
    loading: metersLoading,
    error: metersError,
    loadMeters,
  } = useMeterStore();
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    if (isLoaded) {
      getToken().then((token) => {
        if (active && token) loadMeters(token);
      });
    }
    return () => {
      active = false;
    };
  }, [isLoaded, getToken, loadMeters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = await getToken();
    if (token) await loadMeters(token);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } finally {
      setSigningOut(false);
    }
  };

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
        }}
      >
        <ActivityIndicator size="large" color={C.indigo} />
      </View>
    );
  }

  const phone =
    user?.primaryPhoneNumber?.phoneNumber ??
    user?.primaryEmailAddress?.emailAddress ??
    "Unknown";

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
        <View>
          <Text style={{ color: C.muted, fontSize: 13 }}>Signed in as</Text>
          <Text
            style={{
              color: C.text,
              fontSize: 15,
              fontWeight: "700",
              marginTop: 2,
            }}
          >
            {phone}
          </Text>
        </View>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: pressed ? C.surface2 : C.surface,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: C.dim,
            opacity: signingOut ? 0.5 : 1,
          })}
        >
          {signingOut ? (
            <ActivityIndicator color={C.indigo} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={16} color={C.indigo} />
              <Text
                style={{ color: C.indigo, fontSize: 13, fontWeight: "700" }}
              >
                Sign Out
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(180)}
        style={{ paddingHorizontal: 20, paddingBottom: 12 }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            color: C.text,
            letterSpacing: -0.5,
          }}
        >
          My Smart Meters
        </Text>
        <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
          {meters.length} meter{meters.length !== 1 ? "s" : ""} linked
        </Text>
      </Animated.View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {metersLoading && !refreshing ? (
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
            <Text style={{ color: C.muted, fontSize: 13 }}>
              Loading meters…
            </Text>
          </View>
        ) : metersError ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
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
              }}
            >
              <Ionicons name="speedometer-outline" size={32} color={C.rose} />
            </View>
            <Text
              style={{
                color: C.rose,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {metersError}
            </Text>
            <Pressable
              onPress={() => {
                getToken().then((t) => {
                  if (t) loadMeters(t);
                });
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 14,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: C.dim,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              })}
            >
              <Ionicons name="refresh" size={16} color={C.text} />
              <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        ) : meters.length === 0 ? (
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
              <Ionicons name="flash-outline" size={40} color={C.dim} />
            </View>
            <Text
              style={{
                color: C.text,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              No meters found
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
                paddingHorizontal: 24,
              }}
            >
              No smart meters are linked to your account yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={meters}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MeterCard
                meter={item}
                index={index}
                onPress={() => router.push(`/meter/${item.id}` as any)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.indigo}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}