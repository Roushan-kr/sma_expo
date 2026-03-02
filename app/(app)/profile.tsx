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
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuth } from '@clerk/clerk-expo';
import { useNavigation } from 'expo-router';

export default function ConsumerProfileScreen() {
  const { getToken } = useAuth();
  const navigation: any = useNavigation();
  const { profile, loading, error, syncProfile, updateProfile } =
    useAuthStore();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phoneNumber: '' });


  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile as any).name || '',
        address: (profile as any).address || '',
        phoneNumber: (profile as any).phoneNumber || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) return;
    await updateProfile(form, token);
    setEdit(false);
    Alert.alert('Profile updated');
  };

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900 px-6 pt-8">
      <View className="flex-row items-center mb-4 gap-4">
        <Pressable onPress={() => navigation.openDrawer()} className="p-2 -ml-2">
          <Text className="text-slate-300 text-2xl">☰</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-slate-50">My Profile</Text>
      </View>
      {error ? <Text className="text-red-400 mb-2">{error}</Text> : null}
      <View className="gap-4">
        <TextInput
          className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3 text-slate-50"
          value={form.name}
          editable={edit}
          onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
          placeholder="Name"
        />
        <TextInput
          className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3 text-slate-50"
          value={form.address}
          editable={edit}
          onChangeText={(t) => setForm((f) => ({ ...f, address: t }))}
          placeholder="Address"
        />
        <TextInput
          className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3 text-slate-50"
          value={form.phoneNumber}
          editable={false}
          placeholder="Phone Number"
        />
      </View>
      <View className="flex-row gap-4 mt-8">
        {edit ? (
          <>
            <Pressable
              className="bg-indigo-500 rounded-xl px-6 py-3 flex-1 items-center"
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Save</Text>
              )}
            </Pressable>
            <Pressable
              className="bg-slate-700 rounded-xl px-6 py-3 flex-1 items-center"
              onPress={() => setEdit(false)}
              disabled={loading}
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            className="bg-indigo-500 rounded-xl px-6 py-3 flex-1 items-center"
            onPress={() => setEdit(true)}
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
