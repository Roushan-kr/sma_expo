import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, SmartMeter } from "@/types/api.types";
import { AdminListLayout } from "@/components/AdminListLayout";

const COLORS = {
  surface: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: COLORS.emerald,
  INACTIVE: COLORS.muted,
  FAULTY: COLORS.rose,
  DISCONNECTED: COLORS.amber,
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
    [getToken],
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

  return (
    <AdminListLayout
      title={filterStatus ? `${filterStatus} Meters` : "All Meters"}
      data={filtered}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => load(true)}
      searchQuery={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by meter number..."
      error={error}
      onRetry={() => load()}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/admin-meter/${item.id}` as any)}
        >
          <View style={styles.cardInfo}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.meterNumber}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: STATUS_COLORS[item.status] + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: STATUS_COLORS[item.status] },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>ID: {item.id}</Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
