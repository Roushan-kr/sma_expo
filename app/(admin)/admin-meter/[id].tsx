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
import { ROLE_TYPE, SmartMeter, Consumer } from "@/types/api.types";

const COLORS = {
  bg: "#0f172a",
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.indigo} />
      </View>
    );
  }

  if (error || !meter) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Meter not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name="speedometer-outline"
            size={40}
            color={COLORS.indigo}
          />
          <View>
            <Text style={styles.title}>{meter.meterNumber}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: STATUS_COLORS[meter.status] + "22" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: STATUS_COLORS[meter.status] },
                ]}
              >
                {meter.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>METER ID</Text>
          <Text style={styles.infoValue}>{meter.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>TARIFF PLAN</Text>
          <Text style={styles.infoValue}>{meter.tariffId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>LAST UPDATED</Text>
          <Text style={styles.infoValue}>
            {new Date(meter.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Consumer Section */}
      <Text style={styles.sectionTitle}>Assigned Consumer</Text>
      {meter.consumer ? (
        <Pressable
          style={styles.consumerCard}
          onPress={() =>
            router.push(`/admin-consumer/${meter.consumer?.id}` as any)
          }
        >
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {meter.consumer.name.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.consumerName}>{meter.consumer.name}</Text>
              <Text style={styles.consumerSub}>
                {meter.consumer.phoneNumber}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Unassigned Meter</Text>
          <Pressable style={styles.assignButton}>
            <Text style={styles.assignButtonText}>Assign Now</Text>
          </Pressable>
        </View>
      )}

      {/* Consumption Summary Action */}
      <View style={{ marginTop: 24 }}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/admin-billing`)}
        >
          <Ionicons name="receipt-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View Recent Bills</Text>
        </Pressable>
      </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  consumerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  consumerName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  consumerSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  assignButton: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: COLORS.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
