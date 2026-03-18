import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  SlideInDown,
  ZoomIn,
} from "react-native-reanimated";
import { useStableToken } from "@/hooks/useStableToken";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import {
  useConsumerSupportStore,
  ConsumerQuery,
  QueryStatus,
} from "@/stores/useConsumerSupportStore";

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

const STATUS_CONFIG: Record<
  QueryStatus,
  { label: string; color: string; iconName: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: {
    label: "Under Review",
    color: C.amber,
    iconName: "time-outline",
  },
  AI_REVIEWED: {
    label: "Processing",
    color: C.blue,
    iconName: "sparkles-outline",
  },
  RESOLVED: {
    label: "Resolved",
    color: C.emerald,
    iconName: "checkmark-circle-outline",
  },
  REJECTED: {
    label: "Rejected",
    color: C.rose,
    iconName: "close-circle-outline",
  },
};

const FILTERS: {
  label: string;
  value: QueryStatus | "ALL";
  iconName: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "All", value: "ALL", iconName: "layers-outline" },
  { label: "Pending", value: "PENDING", iconName: "time-outline" },
  { label: "Processing", value: "AI_REVIEWED", iconName: "sparkles-outline" },
  {
    label: "Resolved",
    value: "RESOLVED",
    iconName: "checkmark-circle-outline",
  },
];

const MAX_CHARS = 500;

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  iconName,
  label,
  value,
  color,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: C.dim,
        borderLeftWidth: 3,
        borderLeftColor: color,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={iconName} size={12} color={color} />
        <Text
          style={{
            color: C.muted,
            fontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          color: C.text,
          fontSize: 20,
          fontWeight: "800",
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Query Card ───────────────────────────────────────────────────────────────

function QueryCard({
  query,
  index = 0,
}: {
  query: ConsumerQuery;
  index?: number;
}) {
  const cfg = STATUS_CONFIG[query.status] ?? STATUS_CONFIG.PENDING;
  const dateStr = new Date(query.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(query.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isActive = query.status === "PENDING" || query.status === "AI_REVIEWED";

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100 + index * 50)}>
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 14,
          borderWidth: 1,
          borderColor: isActive ? `${cfg.color}20` : C.dim,
          borderLeftWidth: 3,
          borderLeftColor: cfg.color,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 18,
            paddingBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: `${cfg.color}14`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: `${cfg.color}25`,
            }}
          >
            <Ionicons name={cfg.iconName} size={14} color={cfg.color} />
            <Text
              style={{
                color: cfg.color,
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              {cfg.label}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="calendar-outline" size={11} color={C.dim} />
            <Text style={{ color: C.dim, fontSize: 11 }}>{dateStr}</Text>
          </View>
        </View>

        {/* Query Text */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
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
                marginTop: 2,
              }}
            >
              <Ionicons name="chatbubble-outline" size={14} color={C.blue} />
            </View>
            <Text
              style={{
                flex: 1,
                color: C.text,
                fontSize: 15,
                lineHeight: 23,
              }}
            >
              {query.queryText}
            </Text>
          </View>
        </View>

        {/* AI Category */}
        {query.aiCategory && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(99,92,241,0.06)",
                borderWidth: 1,
                borderColor: "rgba(99,92,241,0.12)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                alignSelf: "flex-start",
                marginLeft: 38,
              }}
            >
              <Ionicons name="sparkles" size={11} color={C.indigo} />
              <Text
                style={{
                  color: C.indigo,
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {query.aiCategory}
              </Text>
            </View>
          </View>
        )}

        {/* Admin Reply */}
        {query.adminReply && (
          <View
            style={{
              marginHorizontal: 18,
              marginBottom: 18,
              backgroundColor: C.surface2,
              borderRadius: 14,
              padding: 16,
              borderLeftWidth: 3,
              borderLeftColor: C.indigo,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: "rgba(99,92,241,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="return-down-forward-outline"
                  size={12}
                  color={C.indigo}
                />
              </View>
              <Text
                style={{
                  color: C.indigo,
                  fontSize: 11,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Support Reply
              </Text>
            </View>
            <Text
              style={{
                color: C.text,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {query.adminReply}
            </Text>
          </View>
        )}

        {/* Footer timestamp */}
        {!query.adminReply && (
          <View
            style={{
              paddingHorizontal: 18,
              paddingBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginLeft: 38,
            }}
          >
            <Ionicons name="time-outline" size={11} color={C.dim} />
            <Text style={{ color: C.dim, fontSize: 11 }}>{timeStr}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── New Query Modal ──────────────────────────────────────────────────────────

function NewQueryModal({
  visible,
  onClose,
  onSubmit,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  submitting: boolean;
}) {
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setMessage("");
      setFocused(false);
    }
  }, [visible]);

  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isValid = message.trim().length > 0 && !isOverLimit;

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(4,10,26,0.8)",
        }}
      >
        {/* Backdrop dismiss */}
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
              paddingBottom: Platform.OS === "ios" ? 40 : 28,
              borderTopWidth: 1,
              borderColor: C.dim,
            }}
          >
            {/* Handle bar */}
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

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
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
                    backgroundColor: "rgba(56,189,248,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color={C.blue}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: C.text,
                    }}
                  >
                    New Query
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    We'll respond as soon as possible
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed ? C.surface2 : C.surface,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Ionicons name="close" size={18} color={C.muted} />
              </Pressable>
            </View>

            {/* Helpful tips */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                backgroundColor: "rgba(56,189,248,0.04)",
                borderWidth: 1,
                borderColor: "rgba(56,189,248,0.1)",
                borderRadius: 12,
                padding: 14,
                gap: 10,
                marginBottom: 18,
              }}
            >
              <Ionicons
                name="bulb-outline"
                size={16}
                color={C.blue}
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: C.muted,
                  fontSize: 12,
                  lineHeight: 18,
                }}
              >
                Include your meter number and describe the issue clearly for
                faster resolution.
              </Text>
            </View>

            {/* Input label */}
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
              Your Message
            </Text>

            {/* Input */}
            <View
              style={{
                backgroundColor: C.surface2,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isOverLimit
                  ? C.rose
                  : focused
                    ? C.indigo
                    : message.trim()
                      ? "rgba(99,92,241,0.25)"
                      : C.dim,
                marginBottom: 8,
              }}
            >
              <TextInput
                ref={inputRef}
                style={{
                  color: C.text,
                  fontSize: 15,
                  padding: 16,
                  minHeight: 130,
                  lineHeight: 22,
                }}
                placeholder="How can we help you today?"
                placeholderTextColor={C.muted}
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={MAX_CHARS + 50} // soft limit
                editable={!submitting}
              />
            </View>

            {/* Character count */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 20,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isOverLimit ? C.rose : C.dim,
                }}
              >
                {charCount}/{MAX_CHARS}
              </Text>
            </View>

            {/* Submit */}
            <Pressable
              onPress={() => isValid && onSubmit(message.trim())}
              disabled={submitting || !isValid}
              style={({ pressed }) => ({
                borderRadius: 16,
                overflow: "hidden",
                opacity: submitting || !isValid ? 0.5 : 1,
                transform: [
                  { scale: pressed && !submitting && isValid ? 0.97 : 1 },
                ],
                shadowColor: C.indigo,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isValid ? 0.35 : 0,
                shadowRadius: 14,
                elevation: isValid ? 10 : 0,
              })}
            >
              <LinearGradient
                colors={isValid ? [C.indigo, C.violet] : [C.dim, C.dim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
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
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      Submit Query
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

export default function ConsumerSupportScreen() {
  useRoleGuard(["CONSUMER"]);

  const { isLoaded } = useAuth();
  const getToken = useStableToken();
  const { user } = useUser();

  const { queries, loading, error, fetchQueries, createQuery } =
    useConsumerSupportStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<QueryStatus | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    if (isLoaded) {
      getToken().then((token) => {
        if (active && token) fetchQueries(token);
      });
    }
    return () => {
      active = false;
    };
  }, [isLoaded, getToken, fetchQueries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = await getToken();
    if (token) await fetchQueries(token);
    setRefreshing(false);
  };

  const handleSubmit = async (message: string) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication error");
      await createQuery(token, message);
      setModalVisible(false);
      Alert.alert(
        "Query Submitted ✓",
        "Our support team will review your query and respond shortly.",
        [{ text: "OK" }],
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  // Derived data
  const filteredQueries =
    filter === "ALL" ? queries : queries.filter((q) => q.status === filter);

  const pendingCount = queries.filter(
    (q) => q.status === "PENDING" || q.status === "AI_REVIEWED",
  ).length;
  const resolvedCount = queries.filter((q) => q.status === "RESOLVED").length;

  // ── Loading (initial) ──
  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
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
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={{ color: C.muted, fontSize: 13 }}
        >
          Loading support…
        </Animated.Text>
      </View>
    );
  }

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
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              Support & Help
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 13,
                marginTop: 4,
                lineHeight: 19,
              }}
            >
              We're here to help with your smart meters
            </Text>
          </View>

          {/* New query button (header) */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => ({
              borderRadius: 14,
              overflow: "hidden",
              transform: [{ scale: pressed ? 0.95 : 1 }],
              shadowColor: C.indigo,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
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
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                New
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Stats ── */}
      {queries.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(180)}
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            gap: 10,
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          <StatPill
            iconName="layers-outline"
            label="Total"
            value={queries.length}
            color={C.blue}
          />
          <StatPill
            iconName="time-outline"
            label="Active"
            value={pendingCount}
            color={C.amber}
          />
          <StatPill
            iconName="checkmark-circle-outline"
            label="Resolved"
            value={resolvedCount}
            color={C.emerald}
          />
        </Animated.View>
      )}

      {/* ── Filters ── */}
      {queries.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
              paddingTop: 14,
              paddingBottom: 14,
            }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.value;
              const count =
                f.value === "ALL"
                  ? queries.length
                  : queries.filter((q) => q.status === f.value).length;

              // Don't render filter if 0 items (except "All")
              if (count === 0 && f.value !== "ALL") return null;

              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 12,
                    paddingHorizontal: 14,
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
                  <View
                    style={{
                      backgroundColor: active
                        ? "rgba(255,255,255,0.2)"
                        : C.surface2,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#fff" : C.muted,
                        fontSize: 10,
                        fontWeight: "800",
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Content ── */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading && !refreshing && queries.length === 0 ? (
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
              Loading your queries…
            </Text>
          </View>
        ) : error && queries.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
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
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={() => {
                getToken().then((t) => {
                  if (t) fetchQueries(t);
                });
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? C.surface2 : C.surface,
                borderRadius: 14,
                paddingHorizontal: 24,
                paddingVertical: 12,
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
        ) : (
          <FlatList
            data={filteredQueries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <QueryCard query={item} index={index} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
            ListEmptyComponent={
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 60,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 28,
                    backgroundColor: "rgba(56,189,248,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={40}
                    color={C.dim}
                  />
                </View>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 18,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
                  {filter !== "ALL"
                    ? "No matching queries"
                    : "No Support History"}
                </Text>
                <Text
                  style={{
                    color: C.muted,
                    textAlign: "center",
                    paddingHorizontal: 24,
                    fontSize: 14,
                    lineHeight: 21,
                  }}
                >
                  {filter !== "ALL"
                    ? "Try a different filter to see your queries."
                    : "You haven't submitted any queries yet. If you need assistance, tap the + button above."}
                </Text>

                {filter === "ALL" && (
                  <Pressable
                    onPress={() => setModalVisible(true)}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      borderRadius: 14,
                      overflow: "hidden",
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <LinearGradient
                      colors={[C.indigo, C.violet]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        borderRadius: 14,
                      }}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        Create First Query
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.indigo}
              />
            }
          />
        )}
      </View>

      {/* ── FAB (shows when queries exist) ── */}
      {queries.length > 0 && (
        <Animated.View
          entering={FadeInUp.delay(400).duration(500).springify()}
          style={{
            position: "absolute",
            bottom: 32,
            right: 20,
          }}
        >
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.92 : 1 }],
              shadowColor: C.indigo,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            })}
          >
            <LinearGradient
              colors={[C.blue, C.indigo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Modal ── */}
      <NewQueryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}
