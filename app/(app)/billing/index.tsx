import { useAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { api } from '@/lib/api';

// ─── Types (match Prisma BillingReport exactly) ───────────────────────────────

interface BillingReport {
  id: string;
  meterId: string;
  tariffId: string;
  billingStart: string;   // ISO date string
  billingEnd: string;     // ISO date string
  totalUnits: number;
  energyCharge: number;
  fixedCharge: number;
  taxAmount: number | null;
  totalAmount: number;
  version: number;
  isLatest: boolean;
  generatedAt: string;
  // API may include nested meter for display
  meter?: { meterNumber: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const e = new Date(end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

function BillingCard({
  report,
  onDownload,
  downloading,
}: {
  report: BillingReport;
  onDownload: (id: string) => void;
  downloading: boolean;
}) {
  return (
    <View className="bg-slate-800 rounded-2xl p-4 mb-3 gap-3">
      {/* Period + meter number */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-slate-50 font-semibold text-sm">
            {formatPeriod(report.billingStart, report.billingEnd)}
          </Text>
          {report.meter && (
            <Text className="text-slate-500 text-xs mt-0.5">
              Meter: {report.meter.meterNumber}
            </Text>
          )}
        </View>
        {report.isLatest && (
          <View className="bg-indigo-500/20 px-2 py-0.5 rounded-full">
            <Text className="text-indigo-400 text-xs font-semibold">Latest</Text>
          </View>
        )}
      </View>

      {/* Amounts */}
      <View className="flex-row gap-4">
        <View>
          <Text className="text-slate-500 text-xs">Energy</Text>
          <Text className="text-slate-200 text-sm font-medium">
            ₹{report.energyCharge.toFixed(2)}
          </Text>
        </View>
        <View>
          <Text className="text-slate-500 text-xs">Fixed</Text>
          <Text className="text-slate-200 text-sm font-medium">
            ₹{report.fixedCharge.toFixed(2)}
          </Text>
        </View>
        {report.taxAmount != null && (
          <View>
            <Text className="text-slate-500 text-xs">Tax</Text>
            <Text className="text-slate-200 text-sm font-medium">
              ₹{report.taxAmount.toFixed(2)}
            </Text>
          </View>
        )}
        <View className="ml-auto">
          <Text className="text-slate-500 text-xs">Total</Text>
          <Text className="text-slate-50 text-sm font-bold">
            ₹{report.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Units + Download */}
      <View className="flex-row items-center justify-between">
        <Text className="text-slate-400 text-xs">{report.totalUnits} kWh</Text>
        <Pressable
          className={`bg-indigo-500 rounded-xl px-3 py-1.5 ${downloading ? 'opacity-50' : 'opacity-100'}`}
          onPress={() => onDownload(report.id)}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-semibold">⬇ Download</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BillingScreen() {
  const { getToken } = useAuth();

  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const { data } = await api.get<BillingReport[]>('/api/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load billing.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const token = await getToken();
      // Backend returns GeneratedReportFile.fileUrl via a signed URL endpoint
      const { data } = await api.get<{ url: string }>(
        `/api/reports/${reportId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.url) await Linking.openURL(data.url);
    } catch {
      // silently fail
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-slate-50">Billing History</Text>
      </View>

      <View className="flex-1 px-5">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-400 mt-3 text-sm">Loading billing…</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
            <Pressable className="bg-indigo-500 rounded-xl px-5 py-2.5" onPress={fetchReports}>
              <Text className="text-white font-semibold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : reports.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-4xl">🧾</Text>
            <Text className="text-slate-300 font-semibold text-base">No billing records</Text>
            <Text className="text-slate-500 text-sm text-center">
              Your billing history will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BillingCard
                report={item}
                onDownload={handleDownload}
                downloading={downloadingId === item.id}
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
