import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useUserStore } from '@/stores/useUserStore';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { useNavigation } from 'expo-router';

export default function AdminProfileScreen() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const navigation: any = useNavigation();
  const { profile, loading, error, loadProfile } = useUserStore();

  useEffect(() => {
    getToken().then((token) => {
      if (token) loadProfile(token);
    });
  }, [getToken, loadProfile]);

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900 px-6 pt-8">
      <View className="flex-row items-center mb-6 gap-4">
        <Pressable onPress={() => navigation.openDrawer()} className="p-2 -ml-2">
          <Text className="text-slate-300 text-2xl">☰</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-slate-50">Admin Settings</Text>
      </View>

      {error ? (
        <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
          <Text className="text-red-400 text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-indigo-500 rounded-full items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {(profile?.name ?? clerkUser?.firstName ?? 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-50">{profile?.name ?? clerkUser?.fullName}</Text>
          <View className="bg-indigo-500/20 px-3 py-1 rounded-full mt-2">
            <Text className="text-indigo-400 text-xs font-bold uppercase">{profile?.role ?? 'ADMIN'}</Text>
          </View>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Email Address</Text>
            <View className="bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700">
               <Text className="text-slate-200">{profile?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? 'N/A'}</Text>
            </View>
          </View>

          <View>
            <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Assigned Identity</Text>
            <View className="bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700">
               <Text className="text-slate-400 text-xs">ID: {profile?.id}</Text>
            </View>
          </View>

          {profile?.stateId && (
             <View>
               <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Jurisdiction</Text>
               <View className="bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700 flex-row justify-between">
                  <Text className="text-slate-200">State Admin</Text>
                  <Text className="text-indigo-400 font-mono text-xs">{profile.stateId}</Text>
               </View>
             </View>
          )}

          {profile?.boardId && (
             <View>
               <Text className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Utility Board</Text>
               <View className="bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700 flex-row justify-between">
                  <Text className="text-slate-200">Board Admin</Text>
                  <Text className="text-indigo-400 font-mono text-xs">{profile.boardId}</Text>
               </View>
             </View>
          )}
        </View>
      </View>

      <View className="mt-8">
        <Text className="text-center text-slate-500 text-xs">
          Profile management for admins is handled via the state/board management portal.
        </Text>
      </View>
    </SafeAreaView>
  );
}
