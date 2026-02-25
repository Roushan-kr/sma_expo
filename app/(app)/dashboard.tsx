import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const { signOut, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } finally {
      setSigningOut(false);
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const phone = user?.primaryPhoneNumber?.phoneNumber ?? 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-center px-7 gap-4">
        {/* Avatar */}
        <View className="w-20 h-20 rounded-full bg-indigo-600 items-center justify-center mb-2">
          <Text className="text-white text-2xl font-bold">
            {phone.slice(-2).toUpperCase()}
          </Text>
        </View>

        <Text className="text-3xl font-bold text-slate-50">Hello!</Text>
        <Text className="text-base text-slate-400">{phone}</Text>

        {/* Status card */}
        <View className="w-full bg-slate-800 rounded-2xl p-5 mt-4 gap-1.5">
          <Text className="text-xs text-slate-500 uppercase tracking-widest">
            Account status
          </Text>
          <Text className="text-lg font-semibold text-slate-50">✅ Verified</Text>
        </View>

        <Pressable
          className={`mt-8 border border-indigo-600 rounded-xl py-3.5 px-10 items-center ${signingOut ? 'opacity-50' : 'opacity-100'}`}
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {signingOut ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <Text className="text-indigo-400 text-base font-semibold">
              Sign Out
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
