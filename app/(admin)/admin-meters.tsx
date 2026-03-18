import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, SmartMeter } from "@/types/api.types";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
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
  { color: string; iconName: keyof typeof Ionicons.glyphMap }
> = {
  ACTIVE: { color: C.emerald, iconName: "checkmark-circle" },
  INACTIVE: { color: C.muted, iconName: "pause-circle" },
  FAULTY: { color: C.rose, iconName: "warning" },
  DISCONNECTED: { color: C.amber, iconName: "unlink-outline" as any },
};

export default function AdminMetersScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);

  const router = useRouter();
  const { status: filterStatus } = useLocalSearchParams<{ status?: string }>();
  const getToken = useStableToken();

  const [meters, setMeters] = useState<SmartMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await apiRequest<SmartMeter[]>("/api/smart-meters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeters(res.data || []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load meters");
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

  const filtered = meters.filter((m) => {
    const matchesSearch = m.meterNumber
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = filterStatus ? m.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // status summary
  const statusCounts = meters.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
          Loading meters…
        </Animated.Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
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
          {error}
        </Text>
        <Pressable
          onPress={() => load()}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.surface2 : C.surface,
            borderRadius: 14,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: C.dim,
          })}
        >
          <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.indigo}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            {/* ── Title ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "800",
                    color: C.text,
                    letterSpacing: -0.5,
                  }}
                >
                  {filterStatus ? `${filterStatus} Meters` : "Smart Meters"}
                </Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  {meters.length} registered
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: C.dim,
                }}
              >
                <Text style={{ color: C.indigo, fontSize: 13, fontWeight: "700" }}>
                  {filtered.length} shown
                </Text>
              </View>
            </Animated.View>

            {/* ── Status pills ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(160)}
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] ?? {
                  color: C.muted,
                  iconName: "ellipse" as any,
                };
                const isActive = filterStatus === status;
                return (
                  <View
                    key={status}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: isActive
                        ? `${cfg.color}14`
                        : C.surface,
                      borderWidth: 1,
                      borderColor: isActive ? `${cfg.color}30` : C.dim,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Ionicons name={cfg.iconName} size={12} color={cfg.color} />
                    <Text
                      style={{
                        color: cfg.color,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {status}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${cfg.color}20`,
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}
                    >
                      <Text
                        style={{
                          color: cfg.color,
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            {/* ── Search ── */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(220)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.surface2,
                borderWidth: 1.5,
                borderColor: searchFocused ? C.indigo : C.dim,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: Platform.OS === "ios" ? 14 : 10,
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={searchFocused ? C.indigo : C.muted}
              />
              <TextInput
                placeholder="Search by meter number..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ flex: 1, color: C.text, fontSize: 15 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </Pressable>
              )}
            </Animated.View>
          </View>
        }
        renderItem={({ item, index }) => {
          const cfg = STATUS_CONFIG[item.status] ?? {
            color: C.muted,
            iconName: "ellipse" as any,
          };
          return (
            <Animated.View
              entering={FadeInDown.duration(350).delay(80 + index * 35)}
              style={{ paddingHorizontal: 20 }}
            >
              <Pressable
                onPress={() => router.push(`/admin-meter/${item.id}` as any)}
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
                {/* icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: `${cfg.color}14`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name="speedometer-outline"
                    size={20}
                    color={cfg.color}
                  />
                </View>

                {/* info */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: C.text,
                      }}
                    >
                      {item.meterNumber}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: `${cfg.color}14`,
                        borderWidth: 1,
                        borderColor: `${cfg.color}25`,
                        borderRadius: 7,
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
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      fontFamily: "monospace",
                    }}
                    numberOfLines={1}
                  >
                    ID: {item.id}
                  </Text>
                </View>

                {/* arrow */}
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
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 60 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: "rgba(56,189,248,0.06)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="speedometer-outline" size={36} color={C.dim} />
            </View>
            <Text
              style={{
                color: C.muted,
                fontSize: 15,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {search
                ? "No meters match your search"
                : "No meters registered yet"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}