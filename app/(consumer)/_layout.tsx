import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View, Text } from 'react-native';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/useAuthStore';
import { RoleProvider } from '@/context/RoleContext';

export default function ConsumerLayout() {
  const { isSignedIn, getToken } = useAuth();
  const { profile, loading, error, syncProfile } = useAuthStore();

  useEffect(() => {
    if (isSignedIn && !profile && !loading && !error) {
      getToken().then(token => {
        if (token) syncProfile(token);
      });
    }
  }, [isSignedIn, profile, loading, error, getToken, syncProfile]);

  const isBootstrapping = isSignedIn && !profile && loading && !error;

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <RoleProvider>
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
        <Drawer.Screen 
          name="dashboard" 
          options={{ 
            drawerLabel: 'Home',
            title: 'My Dashboard',
          }} 
        />
        <Drawer.Screen 
          name="billing/index" 
          options={{ 
            drawerLabel: 'Billing (View & Pay)',
            title: 'Billing History',
          }} 
        />
        <Drawer.Screen 
          name="notifications/index" 
          options={{ 
            drawerLabel: 'Notifications',
            title: 'Notifications',
          }} 
        />
        <Drawer.Screen 
          name="support/index" 
          options={{ 
            drawerLabel: 'Connect Me (Support)',
            title: 'Support',
          }} 
        />
        <Drawer.Screen 
          name="profile" 
          options={{ 
            drawerLabel: 'My Account',
            title: 'Profile', 
          }} 
        />

        {/* Hidden Screens */}
        <Drawer.Screen 
          name="meter/[id]" 
          options={{ 
            drawerItemStyle: { display: 'none' },
            title: 'Meter Details'
          }} 
        />
      </Drawer>
    </RoleProvider>
  );
}

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 10 }}>
        <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: 'bold' }}>My Utility Portal</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Role: CONSUMER</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
