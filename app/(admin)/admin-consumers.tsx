import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, Consumer, PaginatedResponse } from "@/types/api.types";
import { AdminListLayout } from "@/components/AdminListLayout";

const COLORS = {
  surface: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  indigo: "#6366f1",
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

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await apiRequest<Consumer[] | PaginatedResponse<Consumer>>(
          "/api/consumers",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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

  return (
    <AdminListLayout
      title="Consumers"
      data={filtered}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => load(true)}
      searchQuery={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name or phone..."
      error={error}
      onRetry={() => load()}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/admin-consumer/${item.id}` as any)}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.phoneNumber}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
});
