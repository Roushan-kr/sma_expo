/**
 * Admin — Billing Management
 * View all billing reports, generate new bills, filter by meter/consumer.
 * Roles: SUPER_ADMIN, STATE_ADMIN, BOARD_ADMIN
 */
import { useStableToken } from '@/hooks/useStableToken';
import { useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { apiRequest } from '@/api/common/apiRequest';
import { logger } from '@/lib/logger';
import { ROLE_TYPE } from '@/types/api.types';
import { useRoleGuard } from '@/hooks/useRoleGuard';

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

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#273549',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#475569',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCcy(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const e = new Date(end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

// ─── BillCard ─────────────────────────────────────────────────────────────────

function BillCard({ report }: { report: BillingReport }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        gap: 10,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>
            {report.meter?.consumer?.name ?? report.meter?.meterNumber ?? 'Unknown'}
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {report.meter?.meterNumber} · {fmtDateRange(report.billingStart, report.billingEnd)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {!report.isLatest && (
            <View style={{ backgroundColor: '#f59e0b22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: C.amber, fontWeight: '700' }}>v{report.version}</Text>
            </View>
          )}
          {report.isLatest && (
            <View style={{ backgroundColor: '#6366f122', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: C.indigo, fontWeight: '700' }}>Latest</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amounts */}
      <View style={{ flexDirection: 'row', gap: 0 }}>
        {[
          { label: 'Energy', value: fmtCcy(report.energyCharge) },
          { label: 'Fixed', value: fmtCcy(report.fixedCharge) },
          ...(report.taxAmount != null ? [{ label: 'Tax', value: fmtCcy(report.taxAmount) }] : []),
        ].map((item) => (
          <View key={item.label} style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: C.muted }}>{item.label}</Text>
            <Text style={{ fontSize: 12, color: '#cbd5e1', fontWeight: '600', marginTop: 1 }}>
              {item.value}
            </Text>
          </View>
        ))}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: C.muted }}>Total</Text>
          <Text style={{ fontSize: 15, color: C.text, fontWeight: '800', marginTop: 1 }}>
            {fmtCcy(report.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: C.dim }}>{report.totalUnits.toFixed(1)} kWh</Text>
        {report.tariff && (
          <Text style={{ fontSize: 11, color: C.dim }}>
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
    .toISOString().split('T')[0];
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString().split('T')[0];

  const [meterId, setMeterId] = useState('');
  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(lastOfMonth);
  const [taxRate, setTaxRate] = useState('18');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!meterId.trim()) {
      Alert.alert('Validation', 'Meter ID is required.');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      await apiRequest(
        '/api/billing/generate',
        {
          method: 'POST',
          body: {
            meterId: meterId.trim(),
            billingStart: start,
            billingEnd: end,
            taxRate: parseFloat(taxRate) / 100,
          },
          headers: { Authorization: `Bearer ${token}` } 
        },
      );
      Alert.alert('Success', 'Billing report generated!');
      onGenerated();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate bill.');
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
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        style={{
          backgroundColor: C.surface2,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
          color: C.text,
          borderWidth: 1,
          borderColor: C.dim,
        }}
      />
      {hint ? <Text style={{ fontSize: 11, color: C.dim }}>{hint}</Text> : null}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' }}>
        <View
          style={{
            backgroundColor: C.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>Generate Bill</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 22, color: C.muted }}>✕</Text>
            </Pressable>
          </View>

          {field('METER ID', meterId, setMeterId, 'e.g. uuid-of-meter')}
          {field('BILLING START (YYYY-MM-DD)', start, setStart, '2024-01-01')}
          {field('BILLING END (YYYY-MM-DD)', end, setEnd, '2024-01-31')}
          {field('TAX RATE (%)', taxRate, setTaxRate, '18', 'Applied as percentage on subtotal')}

          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            style={{
              backgroundColor: C.indigo,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
              marginTop: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
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
  useRoleGuard([ROLE_TYPE.SUPER_ADMIN, ROLE_TYPE.STATE_ADMIN, ROLE_TYPE.BOARD_ADMIN]);

  const getToken = useStableToken();
  const router = useRouter();
  const navigation: any = useNavigation();

  const [reports, setReports] = useState<BillingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateModal, setGenerateModal] = useState(false);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token missing');
      
      const res = await apiRequest<any>('/api/billing?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const inner = res.data;
      const data: BillingReport[] = Array.isArray(inner)
        ? inner                      // flat list
        : Array.isArray(inner?.data)
          ? inner.data               // paginated list
          : [];
          
      setReports(data);
      setTotalRevenue(data.reduce((s, r) => s + (r.totalAmount ?? 0), 0));
      setTotalUnits(data.reduce((s, r) => s + (r.totalUnits ?? 0), 0));

    } catch (e: any) {
      setError(e?.message ?? 'Failed to load billing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // getToken is stable from useStableToken

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, flex: 1 }}>
          Billing Management
        </Text>
        <Pressable
          onPress={() => setGenerateModal(true)}
          style={{ backgroundColor: C.indigo, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Generate</Text>
        </Pressable>
      </View>

      {/* Summary cards */}
      {!loading && !error && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 14,
              borderLeftWidth: 3,
              borderLeftColor: C.indigo,
            }}
          >
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600' }}>TOTAL REVENUE</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginTop: 4 }}>
              {fmtCcy(totalRevenue)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 16,
              padding: 14,
              borderLeftWidth: 3,
              borderLeftColor: C.emerald,
            }}
          >
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600' }}>TOTAL UNITS</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginTop: 4 }}>
              {totalUnits.toFixed(1)} kWh
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.indigo} />
          <Text style={{ color: C.muted, marginTop: 10, fontSize: 13 }}>Loading billing…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ color: '#f87171', textAlign: 'center', fontSize: 14 }}>{error}</Text>
          <Pressable
            onPress={() => load()}
            style={{ backgroundColor: C.indigo, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : reports.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 40 }}>🧾</Text>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>No billing reports</Text>
          <Text style={{ color: C.muted, fontSize: 13 }}>Tap "+ Generate" to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.indigo} />
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
