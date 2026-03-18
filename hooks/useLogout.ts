import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert } from 'react-native';

export function useLogout() {
  const { signOut } = useAuth();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await signOut();
      clearAuth();
    } catch (err) {
      console.error("Logout failed", err);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return { handleLogout };
}
