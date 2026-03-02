import { View, Text, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const { role, syncProfile, isLoaded: storeLoaded } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function handleAuth() {
      if (isLoaded && isSignedIn) {
        setRedirecting(true);
        try {
          const token = await getToken();
          if (!token) {
            setRedirecting(false);
            return;
          }

          // Unified sync
          await syncProfile(token);
          
          const currentRole = useAuthStore.getState().role;

          if (currentRole === 'CONSUMER') {
            router.replace('/dashboard' as any);
          } else if (currentRole) {
            router.replace('/admin-dashboard' as any);
          } else {
            console.warn('User signed in but no role found. Registration may be required.');
            setRedirecting(false);
          }
        } catch (err) {
          console.error('Auth redirection error:', err);
          setRedirecting(false);
        }
      }
    }

    handleAuth();
  }, [isLoaded, isSignedIn, router, getToken, syncProfile]);

  if (!isLoaded || (isSignedIn && redirecting)) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center">
      <View className="px-6 w-full items-center mb-10 mt-10">
        <View className="w-24 h-24 bg-indigo-500 rounded-3xl items-center justify-center mb-8 shadow-lg shadow-indigo-500/50">
          <Text className="text-white text-4xl font-bold">SM</Text>
        </View>

        <Text className="text-5xl font-extrabold text-white text-center mb-4 tracking-tight">
          SmartMettr
        </Text>
        
        <Text className="text-xl font-medium text-indigo-400 text-center mb-8 px-4">
          Connect new era of IoT with smartAPP
        </Text>

        <View className="bg-slate-800/80 rounded-2xl p-6 w-full border border-slate-700/50 shadow-xl mb-12">
          <Text className="text-slate-300 text-center text-lg leading-relaxed">
            Provide better query service to user and management with agentic AI. 
            Experience seamless energy tracking, transparent billing, and automated support issue resolution.
          </Text>
        </View>

        <View className="w-full gap-4 mt-4">
          <Pressable
            onPress={() => router.push('/sign-up' as any)}
            className="w-full bg-indigo-500 py-4 rounded-xl items-center flex-row justify-center active:bg-indigo-600 shadow-lg shadow-indigo-500/30"
          >
            <Text className="text-white font-semibold text-lg tracking-wide">Get Started</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/sign-in' as any)}
            className="w-full bg-slate-800 py-4 rounded-xl items-center border border-slate-700 active:bg-slate-700"
          >
            <Text className="text-white font-semibold text-lg tracking-wide">Log In to Account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
