/**
 * Admin — Customer Queries Management
 * View, filter, and reply to consumer queries.
 * Roles: SUPER_ADMIN, STATE_ADMIN, BOARD_ADMIN, SUPPORT_AGENT
 */
import { useStableToken } from '@/hooks/useStableToken';
import { useRouter, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/lib/api';
import { ROLE_TYPE } from '@/types/api.types';
import { useRoleGuard } from '@/hooks/useRoleGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

type QueryStatus = 'PENDING' | 'AI_REVIEWED' | 'RESOLVED' | 'REJECTED';

interface CustomerQuery {
  id: string;
  consumerId: string;
  queryText: string;
  aiCategory: string | null;
  aiConfidence: number | null;
  status: QueryStatus;
  adminReply: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  consumer?: { name: string; phoneNumber?: string };
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
  blue: '#3b82f6',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#475569',
};

const STATUS_META: Record<QueryStatus, { label: string; bg: string; fg: string }> = {
  PENDING:     { label: 'Pending',     bg: '#f59e0b22', fg: C.amber },
  AI_REVIEWED: { label: 'AI Reviewed', bg: '#3b82f622', fg: C.blue },
  RESOLVED:    { label: 'Resolved',    bg: '#10b98122', fg: C.emerald },
  REJECTED:    { label: 'Rejected',    bg: '#f43f5e22', fg: C.rose },
};

const FILTERS: { label: string; value: QueryStatus | 'ALL' }[] = [
  { label: 'All',     value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'AI ✦',   value: 'AI_REVIEWED' },
  { label: 'Done',    value: 'RESOLVED' },
];

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QueryStatus }) {
  const m = STATUS_META[status];
  return (
    <View style={{ backgroundColor: m.bg, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: m.fg }}>{m.label}</Text>
    </View>
  );
}

// ─── QueryCard ────────────────────────────────────────────────────────────────

function QueryCard({
  query,
  onPress,
}: {
  query: CustomerQuery;
  onPress: () => void;
}) {
  const needsAction = query.status === 'PENDING' || query.status === 'AI_REVIEWED';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? C.surface2 : C.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: needsAction ? C.amber : C.dim,
        gap: 8,
      })}
    >
      {/* Consumer + status row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>
            {query.consumer?.name ?? query.consumerId.slice(0, 8)}
          </Text>
          <Text
            style={{ fontSize: 14, color: C.text, fontWeight: '600', marginTop: 3 }}
            numberOfLines={2}
          >
            {query.queryText}
          </Text>
        </View>
        <StatusBadge status={query.status} />
      </View>

      {/* AI tag */}
      {query.aiCategory ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#6366f122', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, color: C.indigo, fontWeight: '600' }}>
              ✦ {query.aiCategory}
              {query.aiConfidence != null
                ? `  ${(query.aiConfidence * 100).toFixed(0)}%`
                : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Reply preview */}
      {query.adminReply ? (
        <Text style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }} numberOfLines={1}>
          ↳ {query.adminReply}
        </Text>
      ) : null}

      <Text style={{ fontSize: 11, color: C.dim }}>
        {new Date(query.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </Text>
    </Pressable>
  );
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────

function ReplyModal({
  query,
  visible,
  onClose,
  onSubmit,
  submitting,
}: {
  query: CustomerQuery | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (reply: string, newStatus: QueryStatus) => void;
  submitting: boolean;
}) {
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<QueryStatus>('RESOLVED');

  useEffect(() => {
    if (query) {
      setReply(query.adminReply ?? '');
      setStatus(query.status === 'REJECTED' ? 'REJECTED' : 'RESOLVED');
    }
  }, [query]);

  if (!query) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' }}
      >
        <View
          style={{
            backgroundColor: C.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            gap: 16,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>Reply to Query</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 22, color: C.muted }}>✕</Text>
            </Pressable>
          </View>

          {/* Query text */}
          <View style={{ backgroundColor: C.surface, borderRadius: 14, padding: 12 }}>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
              {query.consumer?.name ?? 'Consumer'}
            </Text>
            <Text style={{ fontSize: 13, color: C.text }}>{query.queryText}</Text>
          </View>

          {/* Status picker */}
          <View>
            <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
              SET STATUS
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['RESOLVED', 'REJECTED'] as QueryStatus[]).map((s) => {
                const selected = status === s;
                const m = STATUS_META[s];
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    style={{
                      flex: 1,
                      backgroundColor: selected ? m.bg : C.surface,
                      borderRadius: 12,
                      padding: 10,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: selected ? m.fg : C.dim,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? m.fg : C.muted }}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reply input */}
          <View>
            <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginBottom: 8 }}>
              REPLY MESSAGE
            </Text>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Type your reply…"
              placeholderTextColor={C.dim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: C.surface,
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
                color: C.text,
                minHeight: 110,
                borderWidth: 1,
                borderColor: reply.trim() ? C.indigo + '88' : C.dim,
              }}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={() => reply.trim() && onSubmit(reply.trim(), status)}
            disabled={submitting || !reply.trim()}
            style={{
              backgroundColor: reply.trim() ? C.indigo : C.dim,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                Submit Reply
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminQueriesScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
    ROLE_TYPE.SUPPORT_AGENT,
  ]);

  const getToken = useStableToken();
  const router = useRouter();
  const navigation: any = useNavigation();

  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueryStatus | 'ALL'>('ALL');

  const [selected, setSelected] = useState<CustomerQuery | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const params = filterRef.current !== 'ALL' ? `?status=${filterRef.current}` : '';
      const res = await api.get<{ data: CustomerQuery[] }>(`/api/queries${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueries((res.data as any).data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Failed to load queries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // getToken is stable from useStableToken

  useEffect(() => { load(); }, [filter]); // load is stable, filter is the real trigger

  const handleReply = async (reply: string, newStatus: QueryStatus) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await api.patch(
        `/api/queries/${selected.id}/reply`,
        { adminReply: reply, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setModalVisible(false);
      setSelected(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to submit reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'ALL' ? queries : queries.filter((q) => q.status === filter);

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
        <Pressable onPress={() => navigation.openDrawer()} hitSlop={12}>
          <Text style={{ fontSize: 24, color: C.text }}>☰</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>Customer Queries</Text>
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
            {filtered.length} {filter === 'ALL' ? 'total' : STATUS_META[filter]?.label.toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={{
                backgroundColor: active ? C.indigo : C.surface,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? '#fff' : C.muted,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.indigo} />
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
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 40 }}>💬</Text>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>No queries</Text>
          <Text style={{ color: C.muted, fontSize: 13 }}>
            {filter !== 'ALL' ? 'Try a different filter' : 'All clear!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(q) => q.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.indigo} />
          }
          renderItem={({ item }) => (
            <QueryCard
              query={item}
              onPress={() => {
                setSelected(item);
                setModalVisible(true);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reply Modal */}
      <ReplyModal
        query={selected}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setSelected(null); }}
        onSubmit={handleReply}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}
