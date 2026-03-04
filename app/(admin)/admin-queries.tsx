/**
 * Admin — Customer Queries Management
 * View, filter, and reply to consumer queries.
 * Roles: SUPER_ADMIN, STATE_ADMIN, BOARD_ADMIN, SUPPORT_AGENT
 */
import { useStableToken } from "@/hooks/useStableToken";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";

import {
  useAdminQueryStore,
  type QueryStatus,
  type CustomerQuery,
  STATUS_META,
} from "@/stores/useAdminQueryStore";

export const FILTERS: { label: string; value: QueryStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "AI ✦", value: "AI_REVIEWED" },
  { label: "Done", value: "RESOLVED" },
];

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: QueryStatus }) {
  const m = STATUS_META[status];
  return (
    <View
      className="rounded-full px-2.5 py-0.5"
      style={{ backgroundColor: m.bg }}
    >
      <Text className="text-[11px] font-bold" style={{ color: m.fg }}>
        {m.label}
      </Text>
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
  const needsAction =
    query.status === "PENDING" || query.status === "AI_REVIEWED";
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-[18px] p-4 mb-2.5 border-l-[3px] space-y-2 bg-surface ${
        needsAction ? "border-amber" : "border-dim"
      }`}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#273549" : "#1e293b",
      })}
    >
      {/* Consumer + status row */}
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-xs text-muted font-semibold">
            {query.consumer?.name ?? query.consumerId.slice(0, 8)}
          </Text>
          <Text
            className="text-sm text-text font-semibold mt-0.5"
            numberOfLines={2}
          >
            {query.queryText}
          </Text>
        </View>
        <StatusBadge status={query.status} />
      </View>

      {/* AI tag */}
      {query.aiCategory ? (
        <View className="flex-row items-center space-x-1.5">
          <View className="bg-indigo/10 rounded-lg px-2 py-0.5">
            <Text className="text-[11px] text-indigo font-semibold">
              ✦ {query.aiCategory}
              {query.aiConfidence != null
                ? `  ${(query.aiConfidence * 100).toFixed(0)}%`
                : ""}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Reply preview */}
      {query.adminReply ? (
        <Text className="text-xs text-muted italic" numberOfLines={1}>
          ↳ {query.adminReply}
        </Text>
      ) : null}

      <Text className="text-[11px] text-dim">
        {new Date(query.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
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
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<QueryStatus>("RESOLVED");

  useEffect(() => {
    if (query) {
      setReply(query.adminReply ?? "");
      setStatus(query.status === "REJECTED" ? "REJECTED" : "RESOLVED");
    }
  }, [query]);

  if (!query) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-bg rounded-t-[28px] p-6 space-y-4 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-extrabold text-text">
              Reply to Query
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-2xl text-muted">✕</Text>
            </Pressable>
          </View>

          {/* Query text */}
          <View className="bg-surface rounded-xl p-3">
            <Text className="text-xs text-muted mb-1">
              {query.consumer?.name ?? "Consumer"}
            </Text>
            <Text className="text-[13px] text-text">{query.queryText}</Text>
          </View>

          {/* Status picker */}
          <View>
            <Text className="text-xs text-muted font-semibold mb-2 uppercase">
              Set Status
            </Text>
            <View className="flex-row space-x-2">
              {(["RESOLVED", "REJECTED"] as QueryStatus[]).map((s) => {
                const selected = status === s;
                const m = STATUS_META[s];
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    className="flex-1 rounded-xl p-2.5 items-center border-[1.5px]"
                    style={{
                      backgroundColor: selected ? m.bg : "#1e293b",
                      borderColor: selected ? m.fg : "#475569",
                    }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: selected ? m.fg : "#94a3b8" }}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reply input */}
          <View>
            <Text className="text-xs text-muted font-semibold mb-2 uppercase">
              Reply Message
            </Text>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Type your reply…"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={`bg-surface rounded-xl p-3.5 text-sm text-text min-h-[110px] border ${
                reply.trim() ? "border-indigo/50" : "border-dim"
              }`}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={() => reply.trim() && onSubmit(reply.trim(), status)}
            disabled={submitting || !reply.trim()}
            className={`rounded-2xl p-4 items-center ${
              reply.trim() ? "bg-indigo" : "bg-dim"
            } ${submitting ? "opacity-60" : "opacity-100"}`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-extrabold text-[15px]">
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

  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueryStatus | "ALL">("ALL");

  const [selected, setSelected] = useState<CustomerQuery | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token missing");

        const params =
          filterRef.current !== "ALL" ? `?status=${filterRef.current}` : "";
        const res = await apiRequest<any>(`/api/support${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const inner = res.data;
        const data: CustomerQuery[] = Array.isArray(inner)
          ? inner
          : Array.isArray(inner?.data)
            ? inner.data
            : [];

        setQueries(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load queries.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    load();
  }, [filter, load]);

  const { resolveWithEdit, rejectQuery } = useAdminQueryStore();

  const handleReply = async (reply: string, newStatus: QueryStatus) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (newStatus === "REJECTED") {
        await rejectQuery(token, selected.id);
      } else {
        await resolveWithEdit(token, selected.id, reply);
      }
      setModalVisible(false);
      setSelected(null);
      load();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to submit reply.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filtered =
    filter === "ALL" ? queries : queries.filter((q) => q.status === filter);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-3 space-x-3">
        <View className="flex-1">
          <Text className="text-[22px] font-extrabold text-text">
            Customer Queries
          </Text>
          <Text className="text-xs text-muted mt-0.5">
            {filtered.length}{" "}
            {filter === "ALL"
              ? "total"
              : STATUS_META[filter as QueryStatus]?.label.toLowerCase() || ""}
          </Text>
        </View>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 12,
          paddingBottom: 12,
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`rounded-full px-4 py-2 ${active ? "bg-indigo" : "bg-surface"}`}
            >
              <Text
                className={`text-[13px] font-bold ${active ? "text-white" : "text-muted"}`}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
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
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center space-y-2">
          <Text className="text-4xl">💬</Text>
          <Text className="text-text text-base font-bold">No queries</Text>
          <Text className="text-muted text-[13px]">
            {filter !== "ALL" ? "Try a different filter" : "All clear!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(q) => q.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6366f1"
            />
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
        onClose={() => {
          setModalVisible(false);
          setSelected(null);
        }}
        onSubmit={handleReply}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}
