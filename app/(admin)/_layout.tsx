import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View, Text } from 'react-native';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';
import { RoleProvider } from '@/context/RoleContext';
import { Permission, hasPermission } from '@/constants/permissions';

export default function AdminLayout() {
  const { isSignedIn, getToken } = useAuth();
  const { profile, role, loading, error } = useAuthStore();

  const isBootstrapping = isSignedIn && !profile && loading && !error;

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Use the role from the store directly
  const currentRole = role;

  return (
    <RoleProvider>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent role={currentRole} {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
          drawerStyle: { backgroundColor: '#1e293b' },
          drawerActiveTintColor: '#818cf8',
          drawerInactiveTintColor: '#cbd5e1',
        }}
      >
        <Drawer.Screen 
          name="admin-dashboard" 
          options={{ 
            drawerLabel: 'Control Panel',
            title: 'Admin Dashboard',
          }} 
        />
        <Drawer.Screen 
          name="admin-billing" 
          options={{ 
            drawerLabel: 'Billing Management',
            title: 'Billing Management',
            drawerItemStyle: !hasPermission(currentRole as any, Permission.BILLING_READ) ? { display: 'none' } : {}
          }} 
        />
        <Drawer.Screen 
          name="admin-queries" 
          options={{ 
            drawerLabel: 'Customer Queries',
            title: 'Manage Queries',
            drawerItemStyle: !hasPermission(currentRole as any, Permission.QUERY_MANAGE) ? { display: 'none' } : {}
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            drawerLabel: 'Settings',
            title: 'Profile', 
          }} 
        />

        {/* Hidden Screens */}
        <Drawer.Screen 
          name="admin-query/[id]" 
          options={{ 
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }} 
        />
      </Drawer>
    </RoleProvider>
  );
}

function CustomDrawerContent({ role, ...props }: any) {
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 10 }}>
        <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold' }}>Admin Portal</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Role: {role}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
