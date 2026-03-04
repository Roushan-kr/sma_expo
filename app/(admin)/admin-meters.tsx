import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, SmartMeter } from "@/types/api.types";
import { AdminListLayout } from "@/components/AdminListLayout";

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-emerald/10", text: "text-emerald" },
  INACTIVE: { bg: "bg-muted/10", text: "text-muted" },
  FAULTY: { bg: "bg-rose/10", text: "text-rose" },
  DISCONNECTED: { bg: "bg-amber/10", text: "text-amber" },
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
      renderItem={({ item }) => {
        const statusStyle = STATUS_MAP[item.status] || STATUS_MAP.INACTIVE;
        return (
          <Pressable
            className="bg-surface rounded-2xl p-4 flex-row items-center mb-2.5"
            onPress={() => router.push(`/admin-meter/${item.id}` as any)}
          >
            <View className="flex-1">
              <View className="flex-row items-center space-x-2.5">
                <Text className="text-[15px] font-bold text-text">
                  {item.meterNumber}
                </Text>
                <View className={`${statusStyle.bg} px-2 py-0.5 rounded-md`}>
                  <Text
                    className={`${statusStyle.text} text-[10px] font-extrabold`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-muted mt-1">ID: {item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        );
      }}
    />
  );
}
