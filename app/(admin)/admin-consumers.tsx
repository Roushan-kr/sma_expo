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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, Consumer, PaginatedResponse } from "@/types/api.types";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  blue: "#38bdf8",
  emerald: "#22c55e",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

export default function AdminConsumersScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);

  const router = useRouter();
  const getToken = useStableToken();

  const [consumers, setConsumers] = useState<Consumer[]>([]);
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
        const res = await apiRequest<Consumer[] | PaginatedResponse<Consumer>>(
          "/api/consumers",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setConsumers(data || []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load consumers");
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

  const filtered = consumers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search),
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
          Loading consumers…
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
          <Ionicons name="people-outline" size={32} color={C.rose} />
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
            {/* title */}
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
                  Consumers
                </Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  {consumers.length} registered
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
                <Text
                  style={{ color: C.indigo, fontSize: 13, fontWeight: "700" }}
                >
                  {filtered.length} shown
                </Text>
              </View>
            </Animated.View>

            {/* search */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
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
                placeholder="Search by name or phone..."
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
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(350).delay(100 + index * 40)}
            style={{ paddingHorizontal: 20 }}
          >
            <Pressable
              onPress={() => router.push(`/admin-consumer/${item.id}` as any)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: C.dim,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              {/* avatar */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${C.blue}14`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text
                  style={{
                    color: C.blue,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {item.name[0]?.toUpperCase()}
                </Text>
              </View>

              {/* info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: C.text,
                    marginBottom: 3,
                  }}
                >
                  {item.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="call-outline" size={12} color={C.muted} />
                  <Text style={{ fontSize: 13, color: C.muted }}>
                    {item.phoneNumber}
                  </Text>
                </View>
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
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </View>
            </Pressable>
          </Animated.View>
        )}
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
              <Ionicons name="people-outline" size={36} color={C.dim} />
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
                ? "No consumers match your search"
                : "No consumers registered yet"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
