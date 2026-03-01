import { ROLE_TYPE } from '@/types/api.types';
import { useCurrentRole } from '@/hooks/useRoleBasedView';
import { useRouter,Href } from 'expo-router';
import { useEffect } from 'react';

export function useRoleGuard(
  allowed: ROLE_TYPE[],
  fallback: Href = '/(auth)/sign-in',
) {
  const role = useCurrentRole();
  const router = useRouter();
  useEffect(() => {
    if (role && !allowed.includes(role)) {
      router.replace(fallback);
    }
  }, [role, allowed, router, fallback]);
}
