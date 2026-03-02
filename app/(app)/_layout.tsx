import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View, Text } from 'react-native';

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
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        drawerStyle: { backgroundColor: '#1e293b' },
        drawerActiveTintColor: '#818cf8',
        drawerInactiveTintColor: '#cbd5e1',
      }}
    >
      {/* ── Consumer Routes ── */}
      <Drawer.Screen 
        name="dashboard" 
        options={{ 
          drawerLabel: 'Home',
          title: 'My Dashboard',
          drawerItemStyle: role !== 'CONSUMER' ? { display: 'none' } : {}
        }} 
      />
      <Drawer.Screen 
        name="billing/index" 
        options={{ 
          drawerLabel: 'Billing (View & Pay)',
          title: 'Billing History',
          drawerItemStyle: role !== 'CONSUMER' ? { display: 'none' } : {}
        }} 
      />
      <Drawer.Screen 
        name="notifications/index" 
        options={{ 
          drawerLabel: 'Notifications',
          title: 'Notifications',
          drawerItemStyle: role !== 'CONSUMER' ? { display: 'none' } : {} 
        }} 
      />
      <Drawer.Screen 
        name="support/index" 
        options={{ 
          drawerLabel: 'Connect Me (Support)',
          title: 'Support',
          drawerItemStyle: role !== 'CONSUMER' ? { display: 'none' } : {} 
        }} 
      />

      {/* ── Admin Routes ── */}
      <Drawer.Screen 
        name="admin-dashboard" 
        options={{ 
          drawerLabel: 'Control Panel',
          title: 'Admin Dashboard',
          drawerItemStyle: role === 'CONSUMER' ? { display: 'none' } : {} 
        }} 
      />
      <Drawer.Screen 
        name="admin-billing" 
        options={{ 
          drawerLabel: 'Billing Management',
          title: 'Billing Management',
          drawerItemStyle: role === 'CONSUMER' || role === 'SUPPORT_AGENT' ? { display: 'none' } : {} 
        }} 
      />
      <Drawer.Screen 
        name="admin-queries" 
        options={{ 
          drawerLabel: 'Customer Queries',
          title: 'Manage Queries',
          drawerItemStyle: role === 'CONSUMER' || role === 'AUDITOR' ? { display: 'none' } : {} 
        }} 
      />

      {/* ── Shared Routes ── */}
      <Drawer.Screen 
        name="profile" 
        options={{ 
          drawerLabel: 'My Account',
          title: 'Profile', 
        }} 
      />

      {/* ── Hidden Screens (Accessed via nested navigation, not drawer menu) ── */}
      <Drawer.Screen 
        name="index" 
        options={{ 
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }} 
      />
      <Drawer.Screen 
        name="meter/[id]" 
        options={{ 
          drawerItemStyle: { display: 'none' },
          title: 'Meter Details'
        }} 
      />
      <Drawer.Screen 
        name="admin-query/[id]" 
        options={{ 
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }} 
      />
    </Drawer>
  );
}

// ── Custom Drawer Definition ──
function CustomDrawerContent(props: any) {
  const role = useCurrentRole();
  const title = role === 'CONSUMER' ? 'My Utility Portal' : 'Admin Portal';

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 10 }}>
        <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Role: {role}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
