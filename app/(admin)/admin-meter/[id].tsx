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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, SmartMeter, Consumer } from "@/types/api.types";

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

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    iconName: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  ACTIVE: { color: C.emerald, iconName: "checkmark-circle", label: "Active" },
  INACTIVE: { color: C.muted, iconName: "pause-circle", label: "Inactive" },
  FAULTY: { color: C.rose, iconName: "warning", label: "Faulty" },
  DISCONNECTED: {
    color: C.amber,
    iconName: "unlink-outline" as any,
    label: "Disconnected",
  },
};

function InfoRow({
  label,
  value,
  iconName,
  mono,
  delay = 0,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  mono?: boolean;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface2,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.dim,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: "rgba(99,92,241,0.08)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={iconName} size={16} color={C.indigo} />
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
          {label}
        </Text>
        <Text
          style={{
            color: C.text,
            fontSize: mono ? 12 : 14,
            fontWeight: "600",
            fontFamily: mono ? "monospace" : undefined,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function MeterDetailScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getToken = useStableToken();

  const [meter, setMeter] = useState<
    (SmartMeter & { consumer?: Consumer }) | null
  >(null);
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
        const res = await apiRequest<SmartMeter & { consumer?: Consumer }>(
          `/api/smart-meters/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMeter(res.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load meter details");
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
          Loading meter details…
        </Animated.Text>
      </View>
    );
  }

  // ── Error ──
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
          {error || "Meter not found"}
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

  const cfg = STATUS_CONFIG[meter.status] ?? STATUS_CONFIG.INACTIVE;

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
        {/* ── Header Card ── */}
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
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: `${cfg.color}14`,
                borderWidth: 1.5,
                borderColor: `${cfg.color}30`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="speedometer" size={28} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
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
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: `${cfg.color}14`,
                    borderWidth: 1,
                    borderColor: `${cfg.color}25`,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Ionicons name={cfg.iconName} size={12} color={cfg.color} />
                  <Text
                    style={{
                      color: cfg.color,
                      fontSize: 11,
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{ height: 1, backgroundColor: C.dim, marginBottom: 18 }}
          />

          <InfoRow
            label="Meter ID"
            value={meter.id}
            iconName="finger-print-outline"
            mono
            delay={200}
          />
          <InfoRow
            label="Tariff Plan"
            value={meter.tariffId}
            iconName="pricetag-outline"
            mono
            delay={260}
          />
          <InfoRow
            label="Last Updated"
            value={new Date(meter.updatedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            iconName="time-outline"
            delay={320}
          />
        </Animated.View>

        {/* ── Consumer Section ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(380)}>
          <View
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
                backgroundColor: C.blue,
              }}
            />
            <Ionicons name="person-outline" size={16} color={C.blue} />
            <Text
              style={{
                color: C.text,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Assigned Consumer
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(430)}>
          {meter.consumer ? (
            <Pressable
              onPress={() =>
                router.push(`/admin-consumer/${meter.consumer?.id}` as any)
              }
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 18,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: C.dim,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={[C.blue, C.indigo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}
                >
                  {meter.consumer.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {meter.consumer.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <Ionicons name="call-outline" size={12} color={C.muted} />
                  <Text style={{ color: C.muted, fontSize: 13 }}>
                    {meter.consumer.phoneNumber}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  backgroundColor: C.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </View>
            </Pressable>
          ) : (
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 18,
                padding: 28,
                alignItems: "center",
                borderWidth: 1,
                borderColor: C.dim,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: "rgba(245,158,11,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-add-outline" size={26} color={C.amber} />
              </View>
              <Text style={{ color: C.muted, fontSize: 14, fontWeight: "500" }}>
                Unassigned Meter
              </Text>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: pressed ? C.surface2 : C.surface2,
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: C.dim,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <Ionicons name="add" size={16} color={C.text} />
                <Text
                  style={{ color: C.text, fontSize: 13, fontWeight: "700" }}
                >
                  Assign Now
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* ── Billing CTA ── */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(500)}
          style={{ marginTop: 28 }}
        >
          <Pressable
            onPress={() => router.push(`/admin-billing`)}
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
                alignItems: "center",
                flexDirection: "row",
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
                  letterSpacing: 0.3,
                }}
              >
                View Recent Bills
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
