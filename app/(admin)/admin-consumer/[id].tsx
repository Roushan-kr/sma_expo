import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStableToken } from "@/hooks/useStableToken";
import { apiRequest } from "@/api/common/apiRequest";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE, Consumer, SmartMeter } from "@/types/api.types";

const COLORS = {
  bg: "#0f172a",
  surface: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  indigo: "#6366f1",
  emerald: "#10b981",
};

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.indigo} />
      </View>
    );
  }

  if (error || !consumer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Consumer not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{consumer.name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{consumer.name}</Text>
            <Text style={styles.subText}>Consumer Account</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color={COLORS.muted} />
          <Text style={styles.detailText}>{consumer.phoneNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.muted} />
          <Text style={styles.detailText}>{consumer.address}</Text>
        </View>
      </View>

      {/* Meters Section */}
      <Text style={styles.sectionTitle}>Assigned Meters</Text>
      {meters.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No meters assigned to this consumer.
          </Text>
        </View>
      ) : (
        meters.map((meter) => (
          <Pressable
            key={meter.id}
            style={styles.meterCard}
            onPress={() => router.push(`/admin-meter/${meter.id}` as any)}
          >
            <View>
              <Text style={styles.meterNumber}>{meter.meterNumber}</Text>
              <Text style={styles.meterStatus}>{meter.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  errorText: {
    color: "#f43f5e",
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  subText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  meterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  meterNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  meterStatus: {
    fontSize: 11,
    color: COLORS.emerald,
    marginTop: 2,
  },
});
