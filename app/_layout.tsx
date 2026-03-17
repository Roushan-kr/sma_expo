import '../global.css';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@/lib/token-cache';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';

import { useColorScheme } from '@/hooks/use-color-scheme';
import FlashMessage from 'react-native-flash-message';
import ErrorBoundary from 'react-native-error-boundary';
import { View, Text, Pressable } from 'react-native';
import { AuthHandler } from '@/components/auth/AuthHandler';

const ErrorFallback = (props: { error: Error; resetError: () => void }) => (
  <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Something went wrong</Text>
    <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
      We encountered an unexpected error. Our team has been notified.
    </Text>
    <Pressable 
      onPress={props.resetError} 
      style={{ backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
    </Pressable>
  </View>
);

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkLoaded>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <PaperProvider>
              <AuthHandler>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(consumer)" options={{ headerShown: false }} />
                  <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                </Stack>
              </AuthHandler>
              <StatusBar style="auto" />
              <FlashMessage position="top" />
            </PaperProvider>
          </ThemeProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
