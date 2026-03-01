import { useEffect } from 'react';
import { useCurrentRole } from '@/hooks/useRoleBasedView';
import { useRouter } from 'expo-router';
import { ROLE_TYPE } from '@/types/api.types';

export default function AppEntryRedirect() {
  const role = useCurrentRole();
  const router = useRouter();
  useEffect(() => {
    if (role === ROLE_TYPE.CONSUMER) {
      router.replace('/(app)/dashboard');
    } else if (
      role === ROLE_TYPE.SUPER_ADMIN ||
      role === ROLE_TYPE.STATE_ADMIN ||
      role === ROLE_TYPE.BOARD_ADMIN
    ) {
      router.replace('/(app)/admin-dashboard');
    }
  }, [role, router]);
  return null;
}
