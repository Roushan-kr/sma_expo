import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

export default function VerifyScreen() {
  const router = useRouter();
  useEffect(() => {
    // Immediately redirect to sign-in (or dashboard if already signed in)
    router.replace('/(auth)/sign-in');
  }, [router]);
  return (
    <View className="flex-1 justify-center items-center bg-slate-900">
      <Text className="text-white text-lg">
        Verification not required. Redirecting...
      </Text>
    </View>
  );
}
