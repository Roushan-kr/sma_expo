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
import { ROLE_TYPE, Consumer, SmartMeter } from "@/types/api.types";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const [userRes, meterRes] = await Promise.all([
        apiRequest<Consumer>(`/api/consumers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest<SmartMeter[]>(`/api/smart-meters/consumer/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setConsumer(userRes.data);
      setMeters(meterRes.data || []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load consumer details");
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

  if (error || !consumer) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-rose text-sm px-6 text-center">
          {error || "Consumer not found"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Profile Card */}
      <View className="bg-surface rounded-3xl p-6 mb-6 shadow-sm">
        <View className="flex-row items-center space-x-4">
          <View className="w-[60px] h-[60px] rounded-full bg-indigo items-center justify-center">
            <Text className="text-2xl font-bold text-white">
              {consumer.name.charAt(0)}
            </Text>
          </View>
          <View>
            <Text className="text-xl font-extrabold text-text">
              {consumer.name}
            </Text>
            <Text className="text-[13px] text-muted mt-0.5">
              Consumer Account
            </Text>
          </View>
        </View>

        <View className="h-[1px] bg-slate-700 my-5" />

        <View className="flex-row items-center space-x-3 mb-3">
          <Ionicons name="call-outline" size={16} color="#94a3b8" />
          <Text className="text-sm text-text">{consumer.phoneNumber}</Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <Ionicons name="location-outline" size={16} color="#94a3b8" />
          <Text className="text-sm text-text leading-5">
            {consumer.address}
          </Text>
        </View>
      </View>

      {/* Meters Section */}
      <Text className="text-base font-bold text-text mb-3">
        Assigned Meters
      </Text>
      {meters.length === 0 ? (
        <View className="bg-surface p-6 rounded-2xl items-center">
          <Text className="text-muted text-sm text-center">
            No meters assigned to this consumer.
          </Text>
        </View>
      ) : (
        meters.map((meter) => (
          <Pressable
            key={meter.id}
            className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-2.5"
            onPress={() => router.push(`/admin-meter/${meter.id}` as any)}
          >
            <View>
              <Text className="text-[15px] font-bold text-text">
                {meter.meterNumber}
              </Text>
              <Text className="text-[11px] text-emerald mt-0.5 font-bold uppercase">
                {meter.status}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
