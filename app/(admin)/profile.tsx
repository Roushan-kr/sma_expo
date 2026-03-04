import React from "react";
import { SafeAreaView, View, Text, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUser as useClerkUser } from "@clerk/clerk-expo";

export default function AdminProfileScreen() {
  const { user: clerkUser } = useClerkUser();
  const { profile, loading, error } = useAuthStore();

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg px-6 pt-8">
      {error ? (
        <View className="bg-rose/10 border border-rose/20 p-4 rounded-xl mb-6">
          <Text className="text-rose text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="bg-surface rounded-2xl p-6 border border-dim/20 shadow-sm">
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-indigo rounded-full items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {(profile?.name ?? clerkUser?.firstName ?? "A")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-text">
            {profile?.name ?? clerkUser?.fullName}
          </Text>
          <View className="bg-indigo/20 px-3 py-1 rounded-full mt-2">
            <Text className="text-indigo text-xs font-bold uppercase">
              {(profile as any)?.role ?? "ADMIN"}
            </Text>
          </View>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-muted text-xs font-bold mb-1 uppercase tracking-wider">
              Email Address
            </Text>
            <View className="bg-bg/50 rounded-xl px-4 py-3 border border-dim">
              <Text className="text-text">
                {(profile as any)?.email ??
                  clerkUser?.primaryEmailAddress?.emailAddress ??
                  "N/A"}
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-muted text-xs font-bold mb-1 uppercase tracking-wider">
              Assigned Identity
            </Text>
            <View className="bg-bg/50 rounded-xl px-4 py-3 border border-dim">
              <Text className="text-muted text-xs">ID: {profile?.id}</Text>
            </View>
          </View>

          {profile?.stateId && (
            <View>
              <Text className="text-muted text-xs font-bold mb-1 uppercase tracking-wider">
                Jurisdiction
              </Text>
              <View className="bg-bg/50 rounded-xl px-4 py-3 border border-dim flex-row justify-between">
                <Text className="text-text">State Admin</Text>
                <Text className="text-indigo font-mono text-xs">
                  {profile.stateId}
                </Text>
              </View>
            </View>
          )}

          {profile?.boardId && (
            <View>
              <Text className="text-muted text-xs font-bold mb-1 uppercase tracking-wider">
                Utility Board
              </Text>
              <View className="bg-bg/50 rounded-xl px-4 py-3 border border-dim flex-row justify-between">
                <Text className="text-text">Board Admin</Text>
                <Text className="text-indigo font-mono text-xs">
                  {profile.boardId}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className="mt-8">
        <Text className="text-center text-muted text-xs">
          Profile management for admins is handled via the state/board
          management portal.
        </Text>
      </View>
    </SafeAreaView>
  );
}
