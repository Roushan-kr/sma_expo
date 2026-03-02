import { useStableToken } from '@/hooks/useStableToken';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/lib/api';

// ─── Types (match Prisma CustomerQuery exactly) ────────────────────────────────

/**
 * QueryStatus enum from schema:
 *   PENDING | AI_REVIEWED | RESOLVED | REJECTED
 *
 * Note: no 'subject' field — schema only has queryText
 */
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QueryStatus, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  AI_REVIEWED: 'bg-blue-500/20 text-blue-400',
  RESOLVED: 'bg-emerald-500/20 text-emerald-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

const STATUS_LABEL: Record<QueryStatus, string> = {
  PENDING: 'Pending',
  AI_REVIEWED: 'AI Reviewed',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

function StatusBadge({ status }: { status: QueryStatus }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-500/20 text-slate-400';
  const [bg, fg] = cls.split(' ');
  return (
    <View className={`px-2.5 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>
        {STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}

function QueryCard({ query }: { query: CustomerQuery }) {
  return (
    <View className="bg-slate-800 rounded-2xl p-4 mb-3 gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-slate-50 font-semibold text-sm flex-1" numberOfLines={3}>
          {query.queryText}
        </Text>
        <StatusBadge status={query.status} />
      </View>

      {query.aiCategory ? (
        <Text className="text-slate-500 text-xs">
          AI Category: <Text className="text-slate-400">{query.aiCategory}</Text>
          {query.aiConfidence != null
            ? ` (${(query.aiConfidence * 100).toFixed(0)}%)`
            : ''}
        </Text>
      ) : null}

      {query.adminReply ? (
        <View className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 mt-1">
          <Text className="text-indigo-300 text-xs font-semibold mb-1">Admin Reply</Text>
          <Text className="text-slate-300 text-xs">{query.adminReply}</Text>
        </View>
      ) : null}

      <Text className="text-slate-600 text-xs">
        {new Date(query.createdAt).toLocaleDateString('en-IN')}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const getToken = useStableToken();

  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [queryText, setQueryText] = useState('');  // matches schema field name
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const { data } = await api.get<CustomerQuery[]>('/api/support', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueries(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load queries.');
    } finally {
      setLoading(false);
    }
  }, []); // stable from useStableToken

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const handleSubmit = async () => {
    if (!queryText.trim()) {
      setSubmitError('Please describe your issue.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await getToken();
      // POST body matches backend: { queryText }
      await api.post(
        '/api/support',
        { queryText: queryText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQueryText('');
      setShowForm(false);
      fetchQueries();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? 'Failed to submit query.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-slate-50">Support</Text>
          <Pressable
            className="bg-indigo-500 rounded-xl px-4 py-2"
            onPress={() => { setShowForm((v) => !v); setSubmitError(null); }}
          >
            <Text className="text-white text-sm font-semibold">
              {showForm ? 'Cancel' : '+ New Query'}
            </Text>
          </Pressable>
        </View>

        {/* New query form — sends { queryText } */}
        {showForm ? (
          <View className="mx-5 bg-slate-800 rounded-2xl p-4 mb-4 gap-3">
            <Text className="text-slate-200 font-semibold text-sm">Describe your issue</Text>
            <TextInput
              className="bg-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 min-h-[100px]"
              placeholder="Type your query here…"
              placeholderTextColor="#64748b"
              value={queryText}
              onChangeText={setQueryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
            />
            {submitError ? (
              <Text className="text-red-400 text-xs">{submitError}</Text>
            ) : null}
            <Pressable
              className={`bg-indigo-500 rounded-xl py-3 items-center ${submitting ? 'opacity-50' : 'opacity-100'}`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Submit</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* List */}
        <View className="flex-1 px-5">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center gap-3">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
              <Pressable className="bg-indigo-500 rounded-xl px-5 py-2.5" onPress={fetchQueries}>
                <Text className="text-white font-semibold text-sm">Retry</Text>
              </Pressable>
            </View>
          ) : queries.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2">
              <Text className="text-4xl">💬</Text>
              <Text className="text-slate-300 font-semibold">No queries yet</Text>
              <Text className="text-slate-500 text-sm text-center">
                Tap "+ New Query" to raise a support request.
              </Text>
            </View>
          ) : (
            <FlatList
              data={queries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <QueryCard query={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
