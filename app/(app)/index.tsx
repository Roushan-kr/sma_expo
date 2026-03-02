import { useEffect } from 'react';
import { useCurrentRole } from '@/hooks/useRoleBasedView';
import { useRouter } from 'expo-router';
import { ROLE_TYPE } from '@/types/api.types';

export default function AppEntryRedirect() {
  const role = useCurrentRole();
  const router = useRouter();

  useEffect(() => {
    if (!role) return;
    
    // Redirect cleanly based on role
    if (role === 'CONSUMER') {
      router.replace('/(app)/dashboard');
    } else {
      router.replace('/(app)/admin-dashboard');
    }
  }, [role, router]);

  return null;
}

