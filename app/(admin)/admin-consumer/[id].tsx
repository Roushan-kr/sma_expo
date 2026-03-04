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
import { Svg, Path, Rect } from "react-native-svg";

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
        Array.isArray(queryRes.data) ? queryRes.data : queryRes.data.data || [],
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load consumer details");
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const renderTrendGraph = () => {
    if (bills.length < 2) return null;
    const data = [...bills].reverse().map((b) => b.totalAmount);
    const max = Math.max(...data, 100);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 300;
    const height = 60;
    const stepX = width / (data.length - 1);

    const points = data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <View className="bg-surface rounded-2xl p-4 mb-6">
        <Text className="text-[10px] text-muted font-bold uppercase mb-3">
          Billing Trend (Amount)
        </Text>
        <Svg width={width} height={height}>
          <Path
            d={`M ${points}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
          />
        </Svg>
        <View className="flex-row justify-between mt-2">
          <Text className="text-[9px] text-dim">Past</Text>
          <Text className="text-[9px] text-dim">Recent</Text>
        </View>
      </View>
    );
  };

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

        <View className="h-[1px] bg-slate-700/50 my-5" />

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

      {renderTrendGraph()}

      {/* Meters Section */}
      <View className="mb-6">
        <Text className="text-base font-bold text-text mb-3">
          Assigned Meters
        </Text>
        {meters.length === 0 ? (
          <View className="bg-surface p-6 rounded-2xl">
            <Text className="text-muted text-sm text-center">
              No meters assigned
            </Text>
          </View>
        ) : (
          meters.map((meter) => (
            <Pressable
              key={meter.id}
              className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-2"
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
      </View>

      {/* Billing History Section */}
      <View className="mb-6">
        <Text className="text-base font-bold text-text mb-3">Recent Bills</Text>
        {bills.length === 0 ? (
          <View className="bg-surface p-6 rounded-2xl">
            <Text className="text-muted text-sm text-center">
              No bills generated yet
            </Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View
              key={bill.id}
              className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-2 border-l-4 border-indigo"
            >
              <View>
                <Text className="text-[15px] font-bold text-text">
                  ₹{bill.totalAmount.toLocaleString()}
                </Text>
                <Text className="text-[11px] text-muted mt-0.5">
                  {new Date(bill.billingEnd).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="receipt-outline" size={18} color="#94a3b8" />
            </View>
          ))
        )}
      </View>

      {/* Support Queries Section */}
      <View className="mb-10">
        <Text className="text-base font-bold text-text mb-3">
          Support Tickets
        </Text>
        {queries.length === 0 ? (
          <View className="bg-surface p-6 rounded-2xl">
            <Text className="text-muted text-sm text-center">
              No support queries found
            </Text>
          </View>
        ) : (
          queries.map((q) => (
            <Pressable
              key={q.id}
              className="bg-surface rounded-2xl p-4 mb-2"
              onPress={() => router.push(`/admin-query/${q.id}` as any)}
            >
              <View className="flex-row justify-between items-start mb-1.5">
                <Text
                  className="text-[14px] font-bold text-text flex-1 mr-2"
                  numberOfLines={1}
                >
                  {q.queryText}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-lg ${q.status === "PENDING" ? "bg-amber/10" : "bg-emerald/10"}`}
                >
                  <Text
                    className={`text-[10px] font-bold ${q.status === "PENDING" ? "text-amber" : "text-emerald"}`}
                  >
                    {q.status}
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-dim">
                Submitted {new Date(q.createdAt).toLocaleDateString()}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
