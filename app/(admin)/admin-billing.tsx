import { useStableToken } from "@/hooks/useStableToken";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  ZoomIn,
} from "react-native-reanimated";
import { Svg, Rect, G, Text as SvgText, Line } from "react-native-svg";
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  violet: "#7c3aed",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  blue: "#38bdf8",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

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
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, title }: { data: MonthlyStat[]; title: string }) {
  const width = 320;
  const height = 130;
  const barWidth = 28;
  const gap = 16;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.dim,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: "rgba(99,92,241,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="bar-chart-outline" size={14} color={C.indigo} />
        </View>
        <Text
          style={{
            fontSize: 11,
            color: C.muted,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {title}
        </Text>
      </View>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((t) => {
          const y = height - 22 - (height - 34) * t;
          return (
            <Line
              key={t}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={C.dim}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          );
        })}
        <G>
          {data.map((item, i) => {
            const barHeight = (item.revenue / maxRevenue) * (height - 34);
            const x = i * (barWidth + gap);
            const y = height - 22 - barHeight;
            return (
              <G key={item.month}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={C.indigo}
                  rx={6}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 4}
                  fontSize="9"
                  fill={C.muted}
                  textAnchor="middle"
                  fontWeight="600"
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

// ─── Bill Card ────────────────────────────────────────────────────────────────

function BillCard({
  report,
  onDetail,
}: {
  report: BillingReport;
  onDetail: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() =>
        report.meter?.consumerId && onDetail(report.meter.consumerId)
      }
      style={({ pressed }) => ({
        backgroundColor: pressed ? C.surface2 : C.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.dim,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            {report.meter?.consumer?.name ??
              report.meter?.meterNumber ??
              "Unknown"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Ionicons name="speedometer-outline" size={12} color={C.muted} />
            <Text style={{ fontSize: 12, color: C.muted }}>
              {report.meter?.meterNumber}
            </Text>
            <Text style={{ color: C.dim }}>·</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>
              {fmtDateRange(report.billingStart, report.billingEnd)}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: report.isLatest
              ? "rgba(99,92,241,0.1)"
              : "rgba(245,158,11,0.1)",
            borderWidth: 1,
            borderColor: report.isLatest
              ? "rgba(99,92,241,0.2)"
              : "rgba(245,158,11,0.2)",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: report.isLatest ? C.indigo : C.amber,
            }}
          >
            {report.isLatest ? "LATEST" : `v${report.version}`}
          </Text>
        </View>
      </View>

      {/* breakdown */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.surface2,
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
        }}
      >
        {[
          { label: "Energy", value: fmtCcy(report.energyCharge) },
          { label: "Fixed", value: fmtCcy(report.fixedCharge) },
          ...(report.taxAmount != null
            ? [{ label: "Tax", value: fmtCcy(report.taxAmount) }]
            : []),
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 10,
                color: C.muted,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: C.text,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* total */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="flash" size={12} color={C.blue} />
            <Text style={{ fontSize: 12, color: C.muted }}>
              {report.totalUnits.toFixed(1)} Units
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: C.text,
              marginTop: 2,
              letterSpacing: -0.5,
            }}
          >
            ₹{report.totalAmount.toLocaleString()}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: C.surface2,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: "700" }}>
            Details
          </Text>
          <Ionicons name="chevron-forward" size={14} color={C.muted} />
        </View>
      </View>
    </Pressable>
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    placeholder: string,
    iconName: keyof typeof Ionicons.glyphMap,
    fieldKey: string,
  ) => (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: C.muted,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.surface2,
          borderWidth: 1.5,
          borderColor: focusedField === fieldKey ? C.indigo : C.dim,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          gap: 10,
        }}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={focusedField === fieldKey ? C.indigo : C.muted}
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
          style={{ flex: 1, color: C.text, fontSize: 15 }}
        />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.65)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(140)}
          style={{
            backgroundColor: C.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            borderTopWidth: 1,
            borderColor: C.dim,
          }}
        >
          {/* handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.dim,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(99,92,241,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={C.indigo}
                />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>
                Generate Bill
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: pressed ? C.surface2 : C.surface,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Ionicons name="close" size={18} color={C.muted} />
            </Pressable>
          </View>

          {field(
            "Meter Number or ID",
            meterId,
            setMeterId,
            "e.g. MTR-12345",
            "speedometer-outline",
            "meter",
          )}
          {field(
            "Period Start",
            start,
            setStart,
            "YYYY-MM-DD",
            "calendar-outline",
            "start",
          )}
          {field(
            "Period End",
            end,
            setEnd,
            "YYYY-MM-DD",
            "calendar-outline",
            "end",
          )}
          {field(
            "Tax Rate (%)",
            taxRate,
            setTaxRate,
            "18",
            "calculator-outline",
            "tax",
          )}

          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            style={({ pressed }) => ({
              borderRadius: 14,
              overflow: "hidden",
              opacity: loading ? 0.6 : 1,
              marginTop: 8,
              transform: [{ scale: pressed && !loading ? 0.97 : 1 }],
              shadowColor: C.indigo,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 10,
            })}
          >
            <LinearGradient
              colors={[C.indigo, C.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                  >
                    Process Invoice
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Animated.View>
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
  const [searchFocused, setSearchFocused] = useState(false);

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
            { headers: { Authorization: `Bearer ${token}` } },
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
    <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
      {/* search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.surface2,
          borderWidth: 1.5,
          borderColor: searchFocused ? C.indigo : C.dim,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={searchFocused ? C.indigo : C.muted}
        />
        <TextInput
          placeholder="Search by name or meter..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{ flex: 1, color: C.text, fontSize: 15 }}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </Pressable>
        )}
      </View>

      {/* stat cards */}
      {stats && (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: C.surface,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: C.dim,
                borderLeftWidth: 3,
                borderLeftColor: C.indigo,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="wallet-outline" size={16} color={C.indigo} />
                <Text
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Revenue
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: C.text,
                  letterSpacing: -0.5,
                }}
              >
                {fmtCcy(stats.totalRevenue)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: C.surface,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: C.dim,
                borderLeftWidth: 3,
                borderLeftColor: C.emerald,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="flash-outline" size={16} color={C.emerald} />
                <Text
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Consumption
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: C.text,
                  letterSpacing: -0.5,
                }}
              >
                {(stats.totalRevenue / 10).toFixed(0)}k{" "}
                <Text
                  style={{ fontSize: 12, color: C.muted, fontWeight: "400" }}
                >
                  kWh
                </Text>
              </Text>
            </View>
          </View>

          {stats.monthlyStats && (
            <BarChart data={stats.monthlyStats} title="Collection Trend" />
          )}
        </>
      )}

      {/* section title */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <View
          style={{
            width: 4,
            height: 18,
            borderRadius: 2,
            backgroundColor: C.indigo,
          }}
        />
        <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
          Latest Reports
        </Text>
        <View
          style={{
            backgroundColor: C.surface2,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "700" }}>
            {reports.length}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 26,
            fontWeight: "800",
            color: C.text,
            letterSpacing: -0.5,
          }}
        >
          Billing
        </Text>
        <Pressable
          onPress={() => setGenerateModal(true)}
          style={({ pressed }) => ({
            borderRadius: 14,
            overflow: "hidden",
            transform: [{ scale: pressed ? 0.96 : 1 }],
            shadowColor: C.indigo,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          })}
        >
          <LinearGradient
            colors={[C.indigo, C.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              Generate
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View entering={ZoomIn.springify()}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                backgroundColor: "rgba(99,92,241,0.08)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <ActivityIndicator size="large" color={C.indigo} />
            </View>
          </Animated.View>
          <Text style={{ color: C.muted, fontSize: 13 }}>
            Loading billing data…
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: "rgba(244,63,94,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="cloud-offline-outline" size={32} color={C.rose} />
          </View>
          <Text
            style={{
              color: C.rose,
              textAlign: "center",
              fontSize: 15,
              fontWeight: "500",
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => load()}
            style={({ pressed }) => ({
              backgroundColor: pressed ? C.surface2 : C.surface,
              borderRadius: 14,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: C.dim,
            })}
          >
            <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
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
              tintColor={C.indigo}
            />
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 20 }}>
              <BillCard
                report={item}
                onDetail={(cid) => router.push(`/admin-consumer/${cid}` as any)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 40 }}>
              <Ionicons name="receipt-outline" size={48} color={C.dim} />
              <Text
                style={{
                  color: C.muted,
                  fontSize: 15,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No billing reports found
              </Text>
            </View>
          }
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
