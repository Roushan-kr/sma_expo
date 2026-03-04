import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStableToken } from "@/hooks/useStableToken";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE_TYPE } from "@/types/api.types";
import { useAdminQueryStore } from "@/stores/useAdminQueryStore";
import { StatusBadge } from "../admin-queries";

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

    if (!useAdminQueryStore.getState().error) {
      router.back();
    }
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

    if (!useAdminQueryStore.getState().error) {
      router.back();
    }
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

  if (loading && !selectedQuery) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || !selectedQuery) {
    return (
      <View className="flex-1 bg-bg justify-center items-center p-6 space-y-4">
        <Text className="text-rose text-center">
          {error || "Query not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-surface px-6 py-2.5 rounded-xl border border-dim"
        >
          <Text className="text-indigo font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isResolved =
    selectedQuery.status === "RESOLVED" || selectedQuery.status === "REJECTED";

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center mb-6 space-x-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="p-1"
            >
              <Text className="text-muted text-3xl leading-none">‹</Text>
            </Pressable>
            <View className="flex-1">
              <Text className="text-text text-xl font-extrabold">
                Query Detail
              </Text>
            </View>
            <StatusBadge status={selectedQuery.status} />
          </View>

          {/* Consumer Info */}
          <View className="mb-6">
            <Text className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5">
              Consumer
            </Text>
            <View className="bg-surface rounded-2xl p-4 border border-dim/20 shadow-sm">
              <Text className="text-text text-base font-bold">
                {selectedQuery.consumer?.name || selectedQuery.consumerId}
              </Text>
              <Text className="text-dim text-[11px] mt-1 font-semibold">
                ID: {selectedQuery.consumerId}
              </Text>
              <Text className="text-muted text-xs mt-2">
                Submitted:{" "}
                {new Date(selectedQuery.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          {/* Original Query */}
          <View className="mb-6">
            <Text className="text-muted text-xs font-bold uppercase tracking-wider mb-1.5">
              Original Query
            </Text>
            <View className="bg-surface rounded-2xl p-4 border border-dim/20 shadow-sm">
              <Text className="text-text text-[15px] leading-6">
                "{selectedQuery.queryText}"
              </Text>
            </View>
          </View>

          {/* AI Output Section */}
          {selectedQuery.aiCategory && (
            <View className="mb-6">
              <Text className="text-indigo text-xs font-extrabold uppercase tracking-wider mb-1.5 flex-row items-center">
                ✦ AI Analysis
              </Text>
              <View className="bg-indigo/5 border border-indigo/20 rounded-2xl p-4 space-y-4">
                <View className="flex-row justify-between items-center border-b border-indigo/10 pb-3">
                  <View>
                    <Text className="text-muted text-[10px] font-bold uppercase">
                      Category
                    </Text>
                    <Text className="text-text text-sm font-bold mt-0.5">
                      {selectedQuery.aiCategory}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-muted text-[10px] font-bold uppercase">
                      Confidence
                    </Text>
                    <Text className="text-indigo text-sm font-extrabold mt-0.5">
                      {selectedQuery.aiConfidence
                        ? `${(selectedQuery.aiConfidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                {!isResolved && (
                  <View>
                    <Text className="text-muted text-[10px] font-bold uppercase mb-2">
                      Suggested Reply (Editable)
                    </Text>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      textAlignVertical="top"
                      placeholder="Type reply here..."
                      placeholderTextColor="#475569"
                      className="bg-bg/50 text-text p-4 rounded-xl text-sm min-h-[120px] border border-indigo/20"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Final Admin Reply (Static) */}
          {isResolved && (
            <View className="mb-6">
              <Text className="text-emerald text-xs font-bold uppercase tracking-wider mb-1.5">
                Final Response
              </Text>
              <View className="bg-emerald/5 border border-emerald/20 rounded-2xl p-4">
                <Text className="text-text text-[14px] leading-5">
                  {selectedQuery.adminReply || "No reply provided."}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {!isResolved && (
            <View className="space-y-3 mt-2">
              {selectedQuery.aiCategory &&
                selectedQuery.adminReply === replyText && (
                  <Pressable
                    disabled={submitting}
                    onPress={handleApprove}
                    className={`bg-indigo rounded-2xl p-4 items-center flex-row justify-center space-x-2 ${submitting ? "opacity-60" : "opacity-100"}`}
                  >
                    <Text className="text-white text-base font-extrabold">
                      Approve AI Reply
                    </Text>
                  </Pressable>
                )}

              <Pressable
                disabled={submitting || !replyText.trim()}
                onPress={handleEditAndResolve}
                className={`bg-surface border border-indigo rounded-2xl p-4 items-center ${submitting ? "opacity-60" : "opacity-100"}`}
              >
                <Text className="text-indigo text-base font-extrabold">
                  {selectedQuery.aiCategory &&
                  selectedQuery.adminReply !== replyText
                    ? "Submit Edited Reply"
                    : "Resolve with Reply"}
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting}
                onPress={handleReject}
                className="p-4 items-center"
              >
                <Text className="text-rose text-base font-bold">
                  Reject Query
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
