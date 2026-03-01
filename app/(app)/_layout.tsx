import { Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';

import { useAdminAuthSync } from '@/hooks/useAdminAuthSync';
import { useConsumerAuthSync } from '@/hooks/useConsumerAuthSync';
import { useCurrentRole } from '@/hooks/useRoleBasedView';
import { useUserStore } from '@/stores/useUserStore';
import { useConsumerProfileStore } from '@/stores/useConsumerProfileStore';

export default function AppLayout() {
  const { isSignedIn } = useAuth();

  // ── Identity bootstrap ────────────────────────────────────────────────────
  // Both hooks are internally gated by isSignedIn, so calling both is safe.
  // Only the hook that matches the actual signed-in user will hit the backend.
  useAdminAuthSync();
  useConsumerAuthSync();
  // ─────────────────────────────────────────────────────────────────────────

  const role = useCurrentRole();
  const userError = useUserStore((s) => s.error);
  const consumerError = useConsumerProfileStore((s) => s.error);

  // Block child routes while role is still resolving.
  // Unblock immediately if:
  //   - user is not signed in (let role guards on individual screens handle redirect)
  //   - role has resolved (non-null)
  //   - a backend error occurred (unblock and let role guard redirect to sign-in)
  const isBootstrapping =
    isSignedIn === true && role === null && !userError && !consumerError;

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack>
      {/* index is the entry gate — role is guaranteed resolved by this point */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
      <Stack.Screen
        name="admin-dashboard"
        options={{
          title: 'Admin Dashboard',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
      <Stack.Screen
        name="meter/[id]"
        options={{
          title: 'Meter Detail',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
      <Stack.Screen
        name="billing/index"
        options={{
          title: 'Billing History',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
      <Stack.Screen
        name="support/index"
        options={{
          title: 'Support',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
        }}
      />
    </Stack>
  );
}
