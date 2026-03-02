import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStableToken } from '@/hooks/useStableToken';
import { useNavigation } from 'expo-router';
import { apiRequest } from '@/api/common/apiRequest';

export default function ConsumerProfileScreen() {
  const getToken = useStableToken();
  const navigation: any = useNavigation();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useAuthStore();
  
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phoneNumber: '' });
  
  const [meters, setMeters] = useState<any[]>([]);
  const [metersLoading, setMetersLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile as any).name ?? '',
        address: (profile as any).address ?? '',
        phoneNumber: (profile as any).phoneNumber ?? '',
      });
    }
  }, [profile]);

  const loadMeters = useCallback(async () => {
    setMetersLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await apiRequest<any>('/api/smart-meters/my-meters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Unwrap data depending on how backend sends it
      let data = res.data;
      if (data && Array.isArray(data.data)) {
        data = data.data;
      }
      setMeters(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn("Failed to load meters", e);
    } finally {
      setMetersLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadMeters();
  }, [loadMeters]);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) return;
    await updateProfile(form, token);
    setEdit(false);
    Alert.alert('Success', 'Profile updated successfully.');
  };

  if (profileLoading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6 gap-4">
          <Pressable onPress={() => navigation.openDrawer()} className="p-2 -ml-2" hitSlop={12}>
            <Text className="text-slate-300 text-2xl">☰</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-slate-50">My Profile</Text>
        </View>

        {profileError ? (
          <View className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
            <Text className="text-red-400 text-sm">{profileError}</Text>
          </View>
        ) : null}

        {/* Personal Details Section */}
        <View className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 mb-8">
          <Text className="text-indigo-400 font-bold tracking-wider uppercase text-xs mb-4">
            Personal Information
          </Text>
          
          <View className="gap-4">
            <View>
              <Text className="text-slate-500 text-xs font-bold mb-1 ml-1 uppercase">Full Name</Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 text-slate-50 ${edit ? 'border-indigo-500/50 bg-slate-900/50' : 'border-slate-700 bg-slate-800 opacity-80'}`}
                value={form.name}
                editable={edit}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                placeholder="Your Name"
                placeholderTextColor="#64748b"
              />
            </View>
            <View>
              <Text className="text-slate-500 text-xs font-bold mb-1 ml-1 uppercase">Service Address</Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 text-slate-50 min-h-[80px] ${edit ? 'border-indigo-500/50 bg-slate-900/50' : 'border-slate-700 bg-slate-800 opacity-80'}`}
                value={form.address}
                editable={edit}
                multiline
                textAlignVertical="top"
                onChangeText={(t) => setForm((f) => ({ ...f, address: t }))}
                placeholder="Billing/Service Address"
                placeholderTextColor="#64748b"
              />
            </View>
            <View>
              <Text className="text-slate-500 text-xs font-bold mb-1 ml-1 uppercase">Registered Phone</Text>
              <TextInput
                className="border border-slate-700 rounded-xl bg-slate-800 opacity-60 px-4 py-3 text-slate-50"
                value={form.phoneNumber}
                editable={false}
                placeholder="Phone Number"
                placeholderTextColor="#64748b"
              />
              <Text className="text-slate-500 text-[10px] mt-1 ml-1">Phone number cannot be changed here.</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-6">
            {edit ? (
              <>
                <Pressable
                  className="bg-slate-700 rounded-xl py-3 flex-1 items-center border border-slate-600"
                  onPress={() => setEdit(false)}
                  disabled={profileLoading}
                >
                  <Text className="text-white font-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  className="bg-indigo-500 rounded-xl py-3 flex-1 items-center"
                  onPress={handleSave}
                  disabled={profileLoading}
                >
                  {profileLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold">Save Changes</Text>}
                </Pressable>
              </>
            ) : (
              <Pressable
                className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl py-3 w-full items-center"
                onPress={() => setEdit(true)}
              >
                <Text className="text-indigo-400 font-bold">Edit Details</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Meters & Connection Details */}
        <View className="mb-2">
          <Text className="text-slate-50 text-lg font-bold mb-4">My Meters & Tariffs</Text>
          
          {metersLoading ? (
             <ActivityIndicator color="#6366f1" />
          ) : meters.length === 0 ? (
             <View className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 items-center">
               <Text className="text-slate-400">No smart meters are currently linked to your account.</Text>
             </View>
          ) : (
             <View className="gap-4">
               {meters.map(meter => (
                 <View key={meter.id} className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden">
                   {/* Meter Header */}
                   <View className="bg-slate-800/80 p-4 border-b border-slate-700/50 flex-row justify-between items-center">
                     <View>
                       <Text className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">Meter Number</Text>
                       <Text className="text-slate-50 font-mono text-lg font-bold tracking-widest">{meter.meterNumber}</Text>
                     </View>
                     <View className={`px-3 py-1 rounded-full ${meter.status === 'ACTIVE' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                       <Text className={`text-xs font-bold ${meter.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>{meter.status}</Text>
                     </View>
                   </View>
                   
                   {/* Tariff Info */}
                   {meter.tariff ? (
                     <View className="p-4 gap-3 bg-slate-900/30">
                       <View className="flex-row justify-between items-center">
                         <Text className="text-slate-400 text-xs font-medium">Customer Category</Text>
                         <Text className="text-slate-200 font-bold">{meter.tariff.type}</Text>
                       </View>
                       <View className="flex-row justify-between items-center">
                         <Text className="text-slate-400 text-xs font-medium">Per Unit Rate</Text>
                         <Text className="text-emerald-400 font-bold text-sm">₹{meter.tariff.unitRate?.toFixed(2)} <Text className="text-slate-500 text-xs font-normal">/ kWh</Text></Text>
                       </View>
                       <View className="flex-row justify-between items-center">
                         <Text className="text-slate-400 text-xs font-medium">Monthly Fixed Charge</Text>
                         <Text className="text-slate-200 font-bold text-sm">₹{meter.tariff.fixedCharge?.toFixed(2)}</Text>
                       </View>
                     </View>
                   ) : (
                     <View className="p-4">
                       <Text className="text-slate-500 italic text-sm">No active tariff plan assigned.</Text>
                     </View>
                   )}
                 </View>
               ))}
             </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

