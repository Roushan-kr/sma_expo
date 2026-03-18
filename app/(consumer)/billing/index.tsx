import { useStableToken } from "@/hooks/useStableToken";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { apiRequest } from "@/api/common/apiRequest";
import { logger } from "@/lib/logger";
import { showMessage } from "react-native-flash-message";

const C = {
  bg: "#040a1a",
  surface: "#0b1a2f",
  surface2: "#142840",
  indigo: "#635cf1",
  violet: "#7c3aed",
  blue: "#38bdf8",
  emerald: "#22c55e",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#e8f0fa",
  muted: "#5e7490",
  dim: "#1a2d42",
};

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
  meter?: { meterNumber: string };
}

function formatPeriod(start: string, end: string) {
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

function BillingCard({
  report,
  onDownload,
  downloading,
  index = 0,
}: {
  report: BillingReport;
  onDownload: (id: string) => void;
  downloading: boolean;
  index?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(350).delay(80 + index * 40)}>
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          padding: 18,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: C.dim,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: C.text,
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              {formatPeriod(report.billingStart, report.billingEnd)}
            </Text>
            {report.meter && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 4,
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={12}
                  color={C.muted}
                />
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  {report.meter.meterNumber}
                </Text>
              </View>
            )}
          </View>
          {report.isLatest && (
            <View
              style={{
                backgroundColor: "rgba(99,92,241,0.1)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.2)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: C.indigo,
                  fontSize: 10,
                  fontWeight: "800",
                }}
              >
                LATEST
              </Text>
            </View>
          )}
        </View>

        {/* Breakdown */}
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
            { label: "Energy", value: `₹${report.energyCharge.toFixed(0)}` },
            { label: "Fixed", value: `₹${report.fixedCharge.toFixed(0)}` },
            ...(report.taxAmount != null
              ? [
                  {
                    label: "Tax",
                    value: `₹${report.taxAmount.toFixed(0)}`,
                  },
                ]
              : []),
            {
              label: "Total",
              value: `₹${report.totalAmount.toFixed(0)}`,
              bold: true,
            },
          ].map((item: any) => (
            <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  color: item.bold ? C.text : C.muted,
                  fontSize: item.bold ? 16 : 14,
                  fontWeight: item.bold ? "800" : "600",
                  marginTop: 4,
                }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Ionicons name="flash" size={12} color={C.blue} />
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {report.totalUnits.toFixed(1)} kWh
            </Text>
          </View>
          <Pressable
            onPress={() => onDownload(report.id)}
            disabled={downloading}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: pressed
                ? "rgba(99,92,241,0.15)"
                : "rgba(99,92,241,0.08)",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              opacity: downloading ? 0.5 : 1,
            })}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={C.indigo} />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color={C.indigo} />
                <Text
                  style={{
                    color: C.indigo,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Download
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function BillingScreen() {
  const getToken = useStableToken();

  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");
      const res = await apiRequest<any>("/api/billing/my-bills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inner = res.data;
      setReports(
        Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [],
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to load billing history.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");
      const { data } = await apiRequest<{ url: string }>(
        `/api/billing/my-bills/${reportId}/download`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data?.url) {
        await Linking.openURL(data.url);
      } else {
        showMessage({ message: "Download link not found", type: "warning" });
      }
    } catch (err: any) {
      logger.error("Download failed", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            color: C.text,
            letterSpacing: -0.5,
          }}
        >
          Billing
        </Text>
        <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
          {reports.length} report{reports.length !== 1 ? "s" : ""}
        </Text>
      </Animated.View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
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
              Loading billing…
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
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
              }}
            >
              <Ionicons name="receipt-outline" size={32} color={C.rose} />
            </View>
            <Text
              style={{
                color: C.rose,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={fetchReports}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 14,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: C.dim,
              })}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        ) : reports.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "rgba(56,189,248,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="receipt-outline" size={40} color={C.dim} />
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
              No billing records
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Your billing history will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <BillingCard
                report={item}
                onDownload={handleDownload}
                downloading={downloadingId === item.id}
                index={index}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
