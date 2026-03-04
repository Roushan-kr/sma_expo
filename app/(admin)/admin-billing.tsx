/**
 * Admin — Billing Management
 * View all billing reports, generate new bills, filter by meter/consumer.
 * Roles: SUPER_ADMIN, STATE_ADMIN, BOARD_ADMIN
 */
import { useStableToken } from "@/hooks/useStableToken";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingReport {
  id: string;
  meterId: string;
  tariffId: string;
  billingStart: string;
  billingEnd: string;
  totalUnits: number;
  energyCharge: number;
  fixedCharge: number;
  taxAmount: number | null;
  totalAmount: number;
  version: number;
  isLatest: boolean;
  generatedAt: string;
  meter?: {
    meterNumber: string;
    consumerId: string;
    consumer?: { name: string };
  };
  tariff?: { type: string; unitRate: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCcy(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
  const e = new Date(end).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${s} – ${e}`;
}

// ─── BillCard ─────────────────────────────────────────────────────────────────

function BillCard({ report }: { report: BillingReport }) {
  return (
    <View className="bg-surface rounded-[20px] p-4 mb-2.5 space-y-2.5 shadow-sm">
      {/* Top row */}
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-[13px] font-bold text-text">
            {report.meter?.consumer?.name ??
              report.meter?.meterNumber ??
              "Unknown"}
          </Text>
          <Text className="text-[11px] text-muted mt-0.5">
            {report.meter?.meterNumber} ·{" "}
            {fmtDateRange(report.billingStart, report.billingEnd)}
          </Text>
        </View>
        <View className="flex-row space-x-1.5 items-center">
          {!report.isLatest && (
            <View className="bg-amber/10 rounded-lg px-2 py-0.5">
              <Text className="text-[10px] text-amber font-bold">
                v{report.version}
              </Text>
            </View>
          )}
          {report.isLatest && (
            <View className="bg-indigo/10 rounded-lg px-2 py-0.5">
              <Text className="text-[10px] text-indigo font-bold">Latest</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amounts */}
      <View className="flex-row items-center">
        {[
          { label: "Energy", value: fmtCcy(report.energyCharge) },
          { label: "Fixed", value: fmtCcy(report.fixedCharge) },
          ...(report.taxAmount != null
            ? [{ label: "Tax", value: fmtCcy(report.taxAmount) }]
            : []),
        ].map((item) => (
          <View key={item.label} className="flex-1">
            <Text className="text-[10px] text-muted">{item.label}</Text>
            <Text className="text-xs text-[#cbd5e1] font-semibold mt-0.5">
              {item.value}
            </Text>
          </View>
        ))}
        <View className="items-end">
          <Text className="text-[10px] text-muted">Total</Text>
          <Text className="text-[15px] text-text font-extrabold mt-0.5">
            {fmtCcy(report.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row justify-between pt-1 border-t border-white/5">
        <Text className="text-[11px] text-dim">
          {report.totalUnits.toFixed(1)} kWh
        </Text>
        {report.tariff && (
          <Text className="text-[11px] text-dim">
            {report.tariff.type} · ₹{report.tariff.unitRate}/unit
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Generate Bill Modal ──────────────────────────────────────────────────────

function GenerateBillModal({
  visible,
  onClose,
  onGenerated,
}: {
  visible: boolean;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const getToken = useStableToken();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [meterId, setMeterId] = useState("");
  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(lastOfMonth);
  const [taxRate, setTaxRate] = useState("18");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!meterId.trim()) {
      Alert.alert("Validation", "Meter ID is required.");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      await apiRequest("/api/billing/generate", {
        method: "POST",
        body: {
          meterId: meterId.trim(),
          billingStart: start,
          billingEnd: end,
          taxRate: parseFloat(taxRate) / 100,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Billing report generated!");
      onGenerated();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not generate bill.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder?: string,
    hint?: string,
  ) => (
    <View className="space-y-1.5">
      <Text className="text-xs text-muted font-semibold uppercase">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        className="bg-surface2 rounded-xl px-3.5 py-3 text-sm text-text border border-dim"
      />
      {hint ? <Text className="text-[11px] text-dim">{hint}</Text> : null}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-bg rounded-t-[28px] p-6 space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-extrabold text-text">
              Generate Bill
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-2xl text-muted">✕</Text>
            </Pressable>
          </View>

          {field("Meter ID", meterId, setMeterId, "e.g. uuid-of-meter")}
          {field("Start Date (YYYY-MM-DD)", start, setStart, "2024-01-01")}
          {field("End Date (YYYY-MM-DD)", end, setEnd, "2024-01-31")}
          {field(
            "Tax Rate (%)",
            taxRate,
            setTaxRate,
            "18",
            "Applied as percentage on subtotal",
          )}

          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            className={`rounded-2xl p-4 items-center bg-indigo mt-1 ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-extrabold text-[15px]">
                ⚡ Generate Report
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminBillingScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
  ]);

  const getToken = useStableToken();
  const router = useRouter();

  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateModal, setGenerateModal] = useState(false);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token missing");

        const res = await apiRequest<any>("/api/billing?limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const inner = res.data;
        const data: BillingReport[] = Array.isArray(inner)
          ? inner // flat list
          : Array.isArray(inner?.data)
            ? inner.data // paginated list
            : [];

        setReports(data);
        setTotalRevenue(data.reduce((s, r) => s + (r.totalAmount ?? 0), 0));
        setTotalUnits(data.reduce((s, r) => s + (r.totalUnits ?? 0), 0));
      } catch (e: any) {
        setError(e?.message ?? "Failed to load billing.");
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

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-3 space-x-3">
        <Text className="text-[22px] font-extrabold text-text flex-1">
          Billing Reports
        </Text>
        <Pressable
          onPress={() => setGenerateModal(true)}
          className="bg-indigo rounded-xl px-4 py-2"
        >
          <Text className="text-white font-bold text-[13px]">+ Generate</Text>
        </Pressable>
      </View>

      {/* Summary cards */}
      {!loading && !error && (
        <View className="flex-row px-5 space-x-2.5 mb-3">
          <View className="flex-1 bg-surface rounded-2xl p-3.5 border-l-[3px] border-indigo shadow-sm">
            <Text className="text-[10px] text-muted font-bold uppercase">
              Total Revenue
            </Text>
            <Text className="text-lg font-extrabold text-text mt-1">
              {fmtCcy(totalRevenue)}
            </Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-3.5 border-l-[3px] border-emerald shadow-sm">
            <Text className="text-[10px] text-muted font-bold uppercase">
              Total Units
            </Text>
            <Text className="text-lg font-extrabold text-text mt-1">
              {totalUnits.toFixed(1)} kWh
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-muted mt-2.5 text-[13px]">
            Loading billing…
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6 space-y-3">
          <Text className="text-rose text-center text-sm">{error}</Text>
          <Pressable
            onPress={() => load()}
            className="bg-indigo rounded-xl px-6 py-2.5"
          >
            <Text className="text-white font-bold">Retry</Text>
          </Pressable>
        </View>
      ) : reports.length === 0 ? (
        <View className="flex-1 items-center justify-center space-y-2">
          <Text className="text-4xl">🧾</Text>
          <Text className="text-text text-base font-bold">
            No billing reports
          </Text>
          <Text className="text-muted text-[13px]">
            Tap "+ Generate" to create one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6366f1"
            />
          }
          renderItem={({ item }) => <BillCard report={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Generate Modal */}
      <GenerateBillModal
        visible={generateModal}
        onClose={() => setGenerateModal(false)}
        onGenerated={load}
      />
    </SafeAreaView>
  );
}
