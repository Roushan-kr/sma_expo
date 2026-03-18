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
  ScrollView,
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
import { apiRequest } from "@/api/common/apiRequest";
import { ROLE_TYPE } from "@/types/api.types";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import {
  useAdminQueryStore,
  type QueryStatus,
  type CustomerQuery,
  STATUS_META,
} from "@/stores/useAdminQueryStore";

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

export const FILTERS: {
  label: string;
  value: QueryStatus | "ALL";
  iconName: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "All", value: "ALL", iconName: "layers-outline" },
  { label: "Pending", value: "PENDING", iconName: "time-outline" },
  { label: "AI ✦", value: "AI_REVIEWED", iconName: "sparkles-outline" },
  { label: "Resolved", value: "RESOLVED", iconName: "checkmark-circle-outline" },
];

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: QueryStatus }) {
  const m = STATUS_META[status];
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    PENDING: "time-outline",
    AI_REVIEWED: "sparkles-outline",
    RESOLVED: "checkmark-circle-outline",
    REJECTED: "close-circle-outline",
  };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: m.bg,
        borderWidth: 1,
        borderColor: `${m.fg}20`,
      }}
    >
      <Ionicons name={iconMap[status] ?? "ellipse"} size={12} color={m.fg} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: m.fg }}>
        {m.label}
      </Text>
    </View>
  );
}

// ─── QueryCard ────────────────────────────────────────────────────────────────

function QueryCard({
  query,
  onPress,
  index = 0,
}: {
  query: CustomerQuery;
  onPress: () => void;
  index?: number;
}) {
  const needsAction =
    query.status === "PENDING" || query.status === "AI_REVIEWED";

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(80 + index * 30)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: pressed ? C.surface2 : C.surface,
          borderRadius: 18,
          padding: 18,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: C.dim,
          borderLeftWidth: 3,
          borderLeftColor: needsAction ? C.amber : C.dim,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
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
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: `${C.blue}14`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: C.blue, fontSize: 12, fontWeight: "800" }}
                >
                  {(query.consumer?.name ?? query.consumerId)?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                {query.consumer?.name ?? query.consumerId.slice(0, 8)}
              </Text>
            </View>
            <Text
              style={{
                color: C.text,
                fontSize: 14,
                fontWeight: "600",
                lineHeight: 20,
                marginLeft: 36,
              }}
              numberOfLines={2}
            >
              {query.queryText}
            </Text>
          </View>
          <StatusBadge status={query.status} />
        </View>

        {/* AI tag */}
        {query.aiCategory && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
              marginLeft: 36,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(99,92,241,0.08)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.15)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="sparkles" size={12} color={C.indigo} />
              <Text
                style={{ color: C.indigo, fontSize: 11, fontWeight: "600" }}
              >
                {query.aiCategory}
                {query.aiConfidence != null
                  ? ` · ${(query.aiConfidence * 100).toFixed(0)}%`
                  : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Reply preview */}
        {query.adminReply && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 6,
              backgroundColor: C.surface2,
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
              marginLeft: 36,
            }}
          >
            <Ionicons
              name="return-down-forward-outline"
              size={12}
              color={C.muted}
              style={{ marginTop: 2 }}
            />
            <Text
              style={{ color: C.muted, fontSize: 12, flex: 1, fontStyle: "italic" }}
              numberOfLines={2}
            >
              {query.adminReply}
            </Text>
          </View>
        )}

        {/* date */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginLeft: 36,
          }}
        >
          <Ionicons name="calendar-outline" size={11} color={C.dim} />
          <Text style={{ fontSize: 11, color: C.dim }}>
            {new Date(query.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
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
  const [replyFocused, setReplyFocused] = useState(false);

  useEffect(() => {
    if (query) {
      setReply(query.adminReply ?? "");
      setStatus(query.status === "REJECTED" ? "REJECTED" : "RESOLVED");
    }
  }, [query]);

  if (!query) return null;

  const statusOptions: {
    value: QueryStatus;
    label: string;
    color: string;
    iconName: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      value: "RESOLVED",
      label: "Resolve",
      color: C.emerald,
      iconName: "checkmark-circle-outline",
    },
    {
      value: "REJECTED",
      label: "Reject",
      color: C.rose,
      iconName: "close-circle-outline",
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.65)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(140)}
            style={{
              backgroundColor: C.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              borderTopWidth: 1,
              borderColor: C.dim,
              maxHeight: "90%",
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

            {/* header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
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
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.indigo} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>
                  Reply
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

            {/* query text */}
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 14,
                padding: 16,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: C.dim,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    backgroundColor: `${C.blue}14`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: C.blue, fontSize: 10, fontWeight: "800" }}>
                    {(query.consumer?.name ?? "C")[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                  {query.consumer?.name ?? "Consumer"}
                </Text>
              </View>
              <Text
                style={{ color: C.text, fontSize: 14, lineHeight: 21 }}
              >
                {query.queryText}
              </Text>
            </View>

            {/* status picker */}
            <Text
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 10,
                marginLeft: 4,
              }}
            >
              Set Status
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {statusOptions.map((s) => {
                const selected = status === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setStatus(s.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderRadius: 14,
                      paddingVertical: 14,
                      borderWidth: 1.5,
                      backgroundColor: selected
                        ? `${s.color}10`
                        : C.surface,
                      borderColor: selected ? s.color : C.dim,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <Ionicons
                      name={s.iconName}
                      size={18}
                      color={selected ? s.color : C.muted}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: selected ? s.color : C.muted,
                      }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* reply input */}
            <Text
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 10,
                marginLeft: 4,
              }}
            >
              Reply Message
            </Text>
            <View
              style={{
                backgroundColor: C.surface2,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: replyFocused
                  ? C.indigo
                  : reply.trim()
                    ? "rgba(99,92,241,0.3)"
                    : C.dim,
                marginBottom: 20,
              }}
            >
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder="Type your reply…"
                placeholderTextColor={C.muted}
                onFocus={() => setReplyFocused(true)}
                onBlur={() => setReplyFocused(false)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  color: C.text,
                  fontSize: 15,
                  padding: 16,
                  minHeight: 110,
                }}
              />
            </View>

            {/* submit */}
            <Pressable
              onPress={() => reply.trim() && onSubmit(reply.trim(), status)}
              disabled={submitting || !reply.trim()}
              style={({ pressed }) => ({
                borderRadius: 14,
                overflow: "hidden",
                opacity: submitting || !reply.trim() ? 0.5 : 1,
                transform: [
                  { scale: pressed && !submitting && reply.trim() ? 0.97 : 1 },
                ],
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: reply.trim() ? 0.35 : 0,
                shadowRadius: 14,
                elevation: reply.trim() ? 10 : 0,
              })}
            >
              <LinearGradient
                colors={
                  reply.trim() ? [C.indigo, C.violet] : [C.dim, C.dim]
                }
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
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Submit Reply
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
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
    [getToken]
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
        e?.response?.data?.error ?? "Failed to submit reply."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filtered =
    filter === "ALL" ? queries : queries.filter((q) => q.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              Queries
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              {filtered.length}{" "}
              {filter === "ALL"
                ? "total"
                : STATUS_META[filter as QueryStatus]?.label.toLowerCase() ?? ""}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: C.dim,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={C.indigo} />
            <Text style={{ color: C.indigo, fontSize: 13, fontWeight: "700" }}>
              {queries.filter((q) => q.status === "PENDING").length} pending
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Filter bar ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(180)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            paddingBottom: 14,
            paddingTop: 4,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: active
                    ? C.indigo
                    : pressed
                      ? C.surface2
                      : C.surface,
                  borderWidth: active ? 0 : 1,
                  borderColor: C.dim,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Ionicons
                  name={f.iconName}
                  size={14}
                  color={active ? "#fff" : C.muted}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: active ? "#fff" : C.muted,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

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
            Loading queries…
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
            <Ionicons name="chatbubbles-outline" size={32} color={C.rose} />
          </View>
          <Text
            style={{
              color: C.rose,
              textAlign: "center",
              fontSize: 14,
              lineHeight: 21,
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
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            })}
          >
            <Ionicons name="refresh" size={16} color={C.text} />
            <Text style={{ color: C.text, fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
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
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: "rgba(56,189,248,0.06)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={40} color={C.dim} />
          </View>
          <Text
            style={{
              color: C.text,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            No queries
          </Text>
          <Text style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>
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
              tintColor={C.indigo}
            />
          }
          renderItem={({ item, index }) => (
            <QueryCard
              query={item}
              index={index}
              onPress={() => {
                setSelected(item);
                setModalVisible(true);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

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