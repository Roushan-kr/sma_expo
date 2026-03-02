import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStableToken } from '@/hooks/useStableToken';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { ROLE_TYPE } from '@/types/api.types';
import { useAdminQueryStore, STATUS_META, C } from '@/stores/useAdminQueryStore';
import { StatusBadge } from '../admin-queries';



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
  const { fetchQueryById, selectedQuery, loading, error, approveAI, resolveWithEdit, rejectQuery } = useAdminQueryStore();

  const [replyText, setReplyText] = useState('');
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
    // Prefill the editable text box with the AI reply if it exists, or prior admin edits
    if (selectedQuery?.adminReply) {
      setReplyText(selectedQuery.adminReply);
    }
  }, [selectedQuery]);

  const handleApprove = async () => {
    if (!id) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) { setSubmitting(false); return; }
    await approveAI(token, id);
    setSubmitting(false);
    
    // Automatically navigate back up to the queue list after success
    if (!useAdminQueryStore.getState().error) {
      router.back();
    }
  };

  const handleEditAndResolve = async () => {
    if (!id || !replyText.trim()) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) { setSubmitting(false); return; }
    await resolveWithEdit(token, id, replyText.trim());
    setSubmitting(false);
    
    if (!useAdminQueryStore.getState().error) {
      router.back();
    }
  };

  const handleReject = async () => {
    if (!id) return;
    
    Alert.alert("Reject Query", "Are you sure you want to mark this query as REJECTED?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        setSubmitting(true);
        const token = await getToken();
        if (!token) { setSubmitting(false); return; }
        await rejectQuery(token, id);
        setSubmitting(false);
        if (!useAdminQueryStore.getState().error) router.back();
      }}
    ]);
  };

  if (loading && !selectedQuery) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.indigo} />
      </View>
    );
  }

  if (error || !selectedQuery) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.rose }}>{error || 'Query not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: C.indigo }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isResolved = selectedQuery.status === 'RESOLVED' || selectedQuery.status === 'REJECTED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
              <Text style={{ color: C.muted, fontSize: 32 }}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: 'bold' }}>Query Detail</Text>
            </View>
            <StatusBadge status={selectedQuery.status} />
          </View>

          {/* Consumer Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Consumer</Text>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>
              {selectedQuery.consumer?.name || selectedQuery.consumerId}
            </Text>
            <Text style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>
              Submitted: {new Date(selectedQuery.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Original Query */}
          <View style={{ backgroundColor: C.surface, padding: 16, borderRadius: 12, marginBottom: 24 }}>
            <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: '600' }}>ORIGINAL QUERY</Text>
            <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>
              "{selectedQuery.queryText}"
            </Text>
          </View>

          {/* AI Output Section */}
          {selectedQuery.aiCategory && (
            <View style={{ backgroundColor: '#1e293b88', borderWidth: 1, borderColor: '#3b82f644', padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <Text style={{ color: '#3b82f6', fontSize: 12, marginBottom: 12, fontWeight: '700' }}>✦ AI CLASSIFICATION</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View>
                  <Text style={{ color: C.muted, fontSize: 11 }}>Category</Text>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{selectedQuery.aiCategory}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: C.muted, fontSize: 11 }}>Confidence</Text>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>
                    {selectedQuery.aiConfidence ? `${(selectedQuery.aiConfidence * 100).toFixed(1)}%` : 'N/A'}
                  </Text>
                </View>
              </View>

              {!isResolved && (
                <View>
                  <Text style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>Suggested Reply</Text>
                  <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                    style={{
                      backgroundColor: C.bg,
                      color: C.text,
                      padding: 12,
                      borderRadius: 8,
                      minHeight: 100,
                      textAlignVertical: 'top'
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Already resolved view just shows the final admin reply statically */}
          {isResolved && (
            <View style={{ backgroundColor: C.surface, padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <Text style={{ color: C.emerald, fontSize: 12, marginBottom: 8, fontWeight: '700' }}>FINAL ADMIN REPLY</Text>
              <Text style={{ color: C.text, fontSize: 14 }}>{selectedQuery.adminReply || 'No reply provided.'}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {!isResolved && (
            <View style={{ gap: 12, marginTop: 10 }}>
              {selectedQuery.aiCategory && selectedQuery.adminReply === replyText && (
                <Pressable
                  disabled={submitting}
                  onPress={handleApprove}
                  style={{ backgroundColor: C.indigo, padding: 16, borderRadius: 12, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Approve AI Reply</Text>
                </Pressable>
              )}

              <Pressable
                disabled={submitting || !replyText.trim()}
                onPress={handleEditAndResolve}
                style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.indigo, padding: 16, borderRadius: 12, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
                  {selectedQuery.aiCategory && selectedQuery.adminReply !== replyText ? 'Submit Edited Reply' : 'Resolve with Reply'}
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting}
                onPress={handleReject}
                style={{ padding: 16, alignItems: 'center' }}
              >
                <Text style={{ color: C.rose, fontSize: 15, fontWeight: '600' }}>Reject Query</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
