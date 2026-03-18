import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useStableToken } from "@/hooks/useStableToken";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE } from "@/types/api.types";
import {
  useAdminQueryStore,
  type QueryStatus,
} from "@/stores/useAdminQueryStore";
import { StatusBadge } from "../admin-queries";

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

export default function QueryDetailScreen() {
  useRoleGuard([
    ROLE_TYPE.SUPER_ADMIN,
    ROLE_TYPE.STATE_ADMIN,
    ROLE_TYPE.BOARD_ADMIN,
    ROLE_TYPE.SUPPORT_AGENT,
  ]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getToken = useStableToken();
  const {
    fetchQueryById,
    selectedQuery,
    loading,
    error,
    approveAI,
    resolveWithEdit,
    rejectQuery,
  } = useAdminQueryStore();

  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const token = await getToken();
      if (!token) return;
      await fetchQueryById(token, id);
    }
    load();
  }, [id, getToken, fetchQueryById]);

  useEffect(() => {
    if (selectedQuery?.adminReply) {
      setReplyText(selectedQuery.adminReply);
    }
  }, [selectedQuery]);

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) {
      setSubmitting(false);
      return;
    }
    await approveAI(token, id);
    setSubmitting(false);
    if (!useAdminQueryStore.getState().error) router.back();
  };

  const handleEditAndResolve = async () => {
    if (!id || !replyText.trim()) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) {
      setSubmitting(false);
      return;
    }
    await resolveWithEdit(token, id, replyText.trim());
    setSubmitting(false);
    if (!useAdminQueryStore.getState().error) router.back();
  };

  const handleReject = async () => {
    if (!id) return;
    Alert.alert(
      "Reject Query",
      "Are you sure you want to mark this query as REJECTED?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            const token = await getToken();
            if (!token) {
              setSubmitting(false);
              return;
            }
            await rejectQuery(token, id);
            setSubmitting(false);
            if (!useAdminQueryStore.getState().error) router.back();
          },
        },
      ],
    );
  };

  // ── Loading ──
  if (loading && !selectedQuery) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          alignItems: "center",
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
          Loading query…
        </Animated.Text>
      </View>
    );
  }

  // ── Error ──
  if (error || !selectedQuery) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          alignItems: "center",
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
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={32}
            color={C.rose}
          />
        </View>
        <Text
          style={{
            color: C.rose,
            textAlign: "center",
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {error || "Query not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
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
          <Ionicons name="arrow-back" size={16} color={C.text} />
          <Text style={{ color: C.text, fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isResolved =
    selectedQuery.status === "RESOLVED" || selectedQuery.status === "REJECTED";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: pressed ? C.surface2 : C.surface,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: C.dim,
              })}
            >
              <Ionicons name="chevron-back" size={20} color={C.muted} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.3,
                }}
              >
                Query Detail
              </Text>
            </View>
            <StatusBadge status={selectedQuery.status} />
          </Animated.View>

          {/* ── Consumer Info ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ marginBottom: 16 }}
          >
            <Text
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
                marginLeft: 4,
              }}
            >
              Consumer
            </Text>
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: C.dim,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${C.blue}14`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: C.blue,
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    {(selectedQuery.consumer?.name ??
                      selectedQuery.consumerId)[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {selectedQuery.consumer?.name ?? selectedQuery.consumerId}
                  </Text>
                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      fontFamily: "monospace",
                      marginTop: 2,
                    }}
                  >
                    ID: {selectedQuery.consumerId}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: C.surface2,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="calendar-outline" size={12} color={C.muted} />
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  Submitted{" "}
                  {new Date(selectedQuery.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Original Query ── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={{ marginBottom: 16 }}
          >
            <Text
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
                marginLeft: 4,
              }}
            >
              Original Query
            </Text>
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: C.dim,
              }}
            >
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
                    borderRadius: 8,
                    backgroundColor: "rgba(99,92,241,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={C.indigo}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: C.text,
                    fontSize: 15,
                    lineHeight: 24,
                    fontStyle: "italic",
                  }}
                >
                  "{selectedQuery.queryText}"
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── AI Analysis ── */}
          {selectedQuery.aiCategory && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              style={{ marginBottom: 16 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                  marginLeft: 4,
                }}
              >
                <Ionicons name="sparkles" size={14} color={C.indigo} />
                <Text
                  style={{
                    color: C.indigo,
                    fontSize: 11,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  AI Analysis
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(99,92,241,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(99,92,241,0.12)",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                {/* category + confidence */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(99,92,241,0.08)",
                    marginBottom: 16,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: C.muted,
                        fontSize: 10,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      Category
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "rgba(99,92,241,0.08)",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={12}
                        color={C.indigo}
                      />
                      <Text
                        style={{
                          color: C.text,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {selectedQuery.aiCategory}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: C.muted,
                        fontSize: 10,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      Confidence
                    </Text>
                    <Text
                      style={{
                        color: C.indigo,
                        fontSize: 20,
                        fontWeight: "800",
                        letterSpacing: -0.5,
                      }}
                    >
                      {selectedQuery.aiConfidence
                        ? `${(selectedQuery.aiConfidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                {/* editable reply */}
                {!isResolved && (
                  <View>
                    <Text
                      style={{
                        color: C.muted,
                        fontSize: 10,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        marginBottom: 10,
                      }}
                    >
                      Suggested Reply (Editable)
                    </Text>
                    <View
                      style={{
                        backgroundColor: C.surface2,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: replyFocused
                          ? C.indigo
                          : replyText.trim()
                            ? "rgba(99,92,241,0.25)"
                            : C.dim,
                      }}
                    >
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        onFocus={() => setReplyFocused(true)}
                        onBlur={() => setReplyFocused(false)}
                        multiline
                        textAlignVertical="top"
                        placeholder="Type reply here..."
                        placeholderTextColor={C.muted}
                        style={{
                          color: C.text,
                          fontSize: 14,
                          padding: 16,
                          minHeight: 120,
                          lineHeight: 22,
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── Final Response (resolved) ── */}
          {isResolved && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(500)}
              style={{ marginBottom: 16 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                  marginLeft: 4,
                }}
              >
                <Ionicons
                  name={
                    selectedQuery.status === "RESOLVED"
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={14}
                  color={
                    selectedQuery.status === "RESOLVED" ? C.emerald : C.rose
                  }
                />
                <Text
                  style={{
                    color:
                      selectedQuery.status === "RESOLVED" ? C.emerald : C.rose,
                    fontSize: 11,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Final Response
                </Text>
              </View>
              <View
                style={{
                  backgroundColor:
                    selectedQuery.status === "RESOLVED"
                      ? "rgba(34,197,94,0.04)"
                      : "rgba(244,63,94,0.04)",
                  borderWidth: 1,
                  borderColor:
                    selectedQuery.status === "RESOLVED"
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(244,63,94,0.12)",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <Ionicons
                    name="return-down-forward-outline"
                    size={16}
                    color={C.muted}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: C.text,
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {selectedQuery.adminReply || "No reply provided."}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Action Buttons ── */}
          {!isResolved && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(600)}
              style={{ gap: 12, marginTop: 8 }}
            >
              {/* Approve AI */}
              {selectedQuery.aiCategory &&
                selectedQuery.adminReply === replyText && (
                  <Pressable
                    disabled={submitting}
                    onPress={handleApprove}
                    style={({ pressed }) => ({
                      borderRadius: 16,
                      overflow: "hidden",
                      opacity: submitting ? 0.5 : 1,
                      transform: [{ scale: pressed && !submitting ? 0.97 : 1 }],
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
                        borderRadius: 16,
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
                          <Ionicons name="sparkles" size={18} color="#fff" />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 16,
                            }}
                          >
                            Approve AI Reply
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

              {/* Resolve with edit */}
              <Pressable
                disabled={submitting || !replyText.trim()}
                onPress={handleEditAndResolve}
                style={({ pressed }) => ({
                  backgroundColor:
                    pressed && !submitting ? C.surface2 : C.surface,
                  borderWidth: 1.5,
                  borderColor: replyText.trim() ? C.indigo : C.dim,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: submitting || !replyText.trim() ? 0.5 : 1,
                  transform: [
                    {
                      scale:
                        pressed && !submitting && replyText.trim() ? 0.97 : 1,
                    },
                  ],
                })}
              >
                {submitting ? (
                  <ActivityIndicator color={C.indigo} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-done"
                      size={18}
                      color={C.indigo}
                    />
                    <Text
                      style={{
                        color: C.indigo,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {selectedQuery.aiCategory &&
                      selectedQuery.adminReply !== replyText
                        ? "Submit Edited Reply"
                        : "Resolve with Reply"}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Reject */}
              <Pressable
                disabled={submitting}
                onPress={handleReject}
                style={({ pressed }) => ({
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: pressed ? 0.6 : submitting ? 0.4 : 1,
                })}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={C.rose}
                />
                <Text
                  style={{ color: C.rose, fontWeight: "700", fontSize: 15 }}
                >
                  Reject Query
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
