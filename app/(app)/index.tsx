import { useEffect } from 'react';
import { useCurrentRole } from '@/hooks/useRoleBasedView';
import { useRouter } from 'expo-router';
import { ROLE_TYPE } from '@/types/api.types';

export default function AppEntryRedirect() {
  const role = useCurrentRole();
  const router = useRouter();
  useEffect(() => {
    if (role === 'CONSUMER') {
      router.replace('/(app)/dashboard');
    } else if (
      role === ROLE_TYPE.SUPER_ADMIN ||
      role === ROLE_TYPE.STATE_ADMIN ||
      role === ROLE_TYPE.BOARD_ADMIN
    ) {
      router.replace('/(app)/admin-dashboard');
    }
    // SUPPORT_AGENT and AUDITOR also go to admin-dashboard
    else if (role === ROLE_TYPE.SUPPORT_AGENT || role === ROLE_TYPE.AUDITOR) {
      router.replace('/(app)/admin-dashboard');
    }
  }, [role, router]);
  return null;
}

