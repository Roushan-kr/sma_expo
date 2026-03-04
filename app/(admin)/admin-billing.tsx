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
import { Svg, Rect, G, Text as SvgText } from "react-native-svg";

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

interface MonthlyStat {
  month: string;
  revenue: number;
  consumption: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCcy(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

// ─── Bar Chart Component ──────────────────────────────────────────────────

function BarChart({ data, title }: { data: MonthlyStat[]; title: string }) {
  const width = 320;
  const height = 120;
  const barWidth = 30;
  const gap = 15;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);

  return (
    <View className="bg-surface rounded-3xl p-5 mb-5 shadow-sm">
      <Text className="text-[10px] text-muted font-bold uppercase mb-4">
        {title}
      </Text>
      <Svg width={width} height={height}>
        <G>
          {data.map((item, i) => {
            const barHeight = (item.revenue / maxRevenue) * (height - 20);
            const x = i * (barWidth + gap);
            const y = height - 20 - barHeight;
            return (
              <G key={item.month}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#6366f1"
                  rx={6}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 2}
                  fontSize="8"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

// ─── BillCard ─────────────────────────────────────────────────────────────────

function BillCard({
  report,
  onDetail,
}: {
  report: BillingReport;
  onDetail: (id: string) => void;
}) {
  return (
    <View className="bg-surface rounded-[24px] p-5 mb-3 space-y-3.5 shadow-sm border border-white/5">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-text">
            {report.meter?.consumer?.name ??
              report.meter?.meterNumber ??
              "Unknown"}
          </Text>
          <Text className="text-[11px] text-muted mt-0.5">
            {report.meter?.meterNumber} ·{" "}
            {fmtDateRange(report.billingStart, report.billingEnd)}
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full ${report.isLatest ? "bg-indigo/10" : "bg-amber/10"}`}
        >
          <Text
            className={`text-[10px] font-bold ${report.isLatest ? "text-indigo" : "text-amber"}`}
          >
            {report.isLatest ? "LATEST" : `v${report.version}`}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center pt-2">
        {[
          { label: "Energy", value: fmtCcy(report.energyCharge) },
          { label: "Fixed", value: fmtCcy(report.fixedCharge) },
          ...(report.taxAmount != null
            ? [{ label: "Tax", value: fmtCcy(report.taxAmount) }]
            : []),
        ].map((item) => (
          <View key={item.label} className="flex-1">
            <Text className="text-[10px] text-muted font-bold uppercase">
              {item.label}
            </Text>
            <Text className="text-[13px] text-text font-semibold mt-0.5">
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-center py-1">
        <View>
          <Text className="text-[11px] text-dim">
            {report.totalUnits.toFixed(1)} Unit(s)
          </Text>
          <Text className="text-[20px] font-extrabold text-text mt-0.5">
            ₹{report.totalAmount.toLocaleString()}
          </Text>
        </View>
        <Pressable
          className="bg-surface2 rounded-xl p-2.5"
          onPress={() =>
            report.meter?.consumerId && onDetail(report.meter.consumerId)
          }
        >
          <Text className="text-[11px] text-muted font-bold">DETAILS</Text>
        </Pressable>
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
  ) => (
    <View className="space-y-1.5">
      <Text className="text-[11px] text-muted font-bold uppercase tracking-wider">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        className="bg-surface2 rounded-2xl px-4 py-3.5 text-[14px] text-text border border-white/5"
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-bg rounded-t-[32px] p-7 space-y-5">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[20px] font-extrabold text-text">
              Generate New Bill
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface2 items-center justify-center"
            >
              <Text className="text-muted font-bold">✕</Text>
            </Pressable>
          </View>

          {field(
            "Meter Number or ID",
            meterId,
            setMeterId,
            "e.g. MTR-12345 or UUID",
          )}
          {field("Period Start", start, setStart, "YYYY-MM-DD")}
          {field("Period End", end, setEnd, "YYYY-MM-DD")}
          {field("Tax Rate (%)", taxRate, setTaxRate, "18")}

          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            className="rounded-2xl p-4.5 items-center bg-indigo mt-2 active:opacity-80"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-extrabold text-[15px]">
                ⚡ Process Invoice
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
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const [billRes, statsRes] = await Promise.all([
          apiRequest<any>(
            `/api/billing?limit=100${debouncedSearch ? `&search=${debouncedSearch}` : ""}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
          apiRequest<any>("/api/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setReports(
          Array.isArray(billRes.data) ? billRes.data : billRes.data.data || [],
        );
        setStats(statsRes.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load billing.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, debouncedSearch],
  );

  useEffect(() => {
    load();
  }, [load]);

  const listHeader = () => (
    <View className="px-5 pb-5">
      <View className="mb-6">
        <TextInput
          placeholder="Search by name or meter..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          className="bg-surface2 rounded-2xl px-5 py-3.5 text-text text-sm border border-white/5 mb-6"
        />

        {stats && (
          <>
            <View className="flex-row space-x-3 mb-6">
              <View className="flex-1 bg-surface rounded-[24px] p-5 shadow-sm border-l-4 border-indigo">
                <Text className="text-[10px] text-muted font-bold uppercase">
                  Revenue
                </Text>
                <Text className="text-[20px] font-extrabold text-text mt-1">
                  {fmtCcy(stats.totalRevenue)}
                </Text>
              </View>
              <View className="flex-1 bg-surface rounded-[24px] p-5 shadow-sm border-l-4 border-emerald">
                <Text className="text-[10px] text-muted font-bold uppercase">
                  Consumption
                </Text>
                <Text className="text-[20px] font-extrabold text-text mt-1">
                  {(stats.totalRevenue / 10).toFixed(0)}k{" "}
                  <Text className="text-[10px] text-muted font-normal">
                    kWh
                  </Text>
                </Text>
              </View>
            </View>

            {stats.monthlyStats && (
              <BarChart
                data={stats.monthlyStats}
                title="Collection Trend (Board-Wise)"
              />
            )}
          </>
        )}
      </View>
      <Text className="text-[18px] font-extrabold text-text mb-4">
        Latest Reports
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center px-5 pt-6 pb-4">
        <Text className="text-[26px] font-extrabold text-text flex-1 tracking-tight">
          Billing
        </Text>
        <Pressable
          onPress={() => setGenerateModal(true)}
          className="bg-indigo rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo/20"
        >
          <Text className="text-white font-bold text-[14px]">+ Generate</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6 space-y-4">
          <Text className="text-rose text-center text-[15px] font-medium leading-5">
            {error}
          </Text>
          <Pressable
            onPress={() => load()}
            className="bg-surface2 rounded-2xl px-8 py-3.5"
          >
            <Text className="text-text font-bold">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6366f1"
            />
          }
          renderItem={({ item }) => (
            <View className="px-5">
              <BillCard
                report={item}
                onDetail={(cid) => router.push(`/admin-consumer/${cid}` as any)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <GenerateBillModal
        visible={generateModal}
        onClose={() => setGenerateModal(false)}
        onGenerated={load}
      />
    </SafeAreaView>
  );
}
