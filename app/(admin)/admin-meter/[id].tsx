import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, SmartMeter, Consumer } from "@/types/api.types";

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-emerald/10", text: "text-emerald" },
  INACTIVE: { bg: "bg-muted/10", text: "text-muted" },
  FAULTY: { bg: "bg-rose/10", text: "text-rose" },
  DISCONNECTED: { bg: "bg-amber/10", text: "text-amber" },
};

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await apiRequest<SmartMeter & { consumer?: Consumer }>(
        `/api/smart-meters/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMeter(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load meter details");
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || !meter) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-rose text-sm px-6 text-center">
          {error || "Meter not found"}
        </Text>
      </View>
    );
  }

  const statusStyle = STATUS_MAP[meter.status] || STATUS_MAP.INACTIVE;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Header Info */}
      <View className="bg-surface rounded-3xl p-6 mb-6 shadow-sm">
        <View className="flex-row items-center space-x-4">
          <Ionicons name="speedometer-outline" size={40} color="#6366f1" />
          <View>
            <Text className="text-[22px] font-extrabold text-text">
              {meter.meterNumber}
            </Text>
            <View
              className={`self-start ${statusStyle.bg} px-2 py-0.5 rounded-md mt-1`}
            >
              <Text
                className={`${statusStyle.text} text-[10px] font-extrabold uppercase`}
              >
                {meter.status}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-[1px] bg-slate-700 my-5" />

        <View className="mb-4">
          <Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            METER ID
          </Text>
          <Text className="text-sm text-text font-semibold">{meter.id}</Text>
        </View>
        <View className="mb-4">
          <Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            TARIFF PLAN
          </Text>
          <Text className="text-sm text-text font-semibold">
            {meter.tariffId}
          </Text>
        </View>
        <View>
          <Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            LAST UPDATED
          </Text>
          <Text className="text-sm text-text font-semibold">
            {new Date(meter.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Consumer Section */}
      <Text className="text-base font-bold text-text mb-3">
        Assigned Consumer
      </Text>
      {meter.consumer ? (
        <Pressable
          className="bg-surface rounded-2xl p-4 flex-row items-center justify-between"
          onPress={() =>
            router.push(`/admin-consumer/${meter.consumer?.id}` as any)
          }
        >
          <View className="flex-row items-center space-x-4">
            <View className="w-11 h-11 rounded-full bg-indigo items-center justify-center">
              <Text className="text-lg font-bold text-white">
                {meter.consumer.name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-[15px] font-bold text-text">
                {meter.consumer.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {meter.consumer.phoneNumber}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </Pressable>
      ) : (
        <View className="bg-surface p-6 rounded-2xl items-center space-y-3">
          <Text className="text-muted text-sm">Unassigned Meter</Text>
          <Pressable className="bg-slate-700 px-4 py-2 rounded-xl">
            <Text className="text-white text-xs font-bold">Assign Now</Text>
          </Pressable>
        </View>
      )}

      {/* Consumption Summary Action */}
      <View className="mt-6">
        <Pressable
          className="bg-indigo flex-row items-center justify-center p-4 rounded-2xl space-x-2.5 shadow-md"
          onPress={() => router.push(`/admin-billing`)}
        >
          <Ionicons name="receipt-outline" size={20} color="#fff" />
          <Text className="text-white text-[15px] font-extrabold">
            View Recent Bills
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
