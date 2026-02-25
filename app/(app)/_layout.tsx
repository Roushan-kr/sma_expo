import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen
        name="meter/[id]"
        options={{ title: 'Meter Detail', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f8fafc' }}
      />
      <Stack.Screen
        name="billing/index"
        options={{ title: 'Billing History', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f8fafc' }}
      />
      <Stack.Screen
        name="support/index"
        options={{ title: 'Support', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f8fafc' }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{ title: 'Notifications', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f8fafc' }}
      />
    </Stack>
  );
}
