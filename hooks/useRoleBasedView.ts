import { ROLE_TYPE } from '@/types/api.types';
import { useUserStore } from '@/stores/useUserStore';
import { useConsumerProfileStore } from '@/stores/useConsumerProfileStore';

export function useCurrentRole(): ROLE_TYPE | null {
  const adminProfile = useUserStore((s) => s.profile);
  const consumerProfile = useConsumerProfileStore((s) => s.profile);

  if (adminProfile?.role) return adminProfile.role;
  if (consumerProfile) return ROLE_TYPE.CONSUMER;
  return null;
}

export function useRoleBasedView<T>(
  views: Partial<Record<ROLE_TYPE, T>>,
  fallback?: T,
): T | undefined {
  const role = useCurrentRole();
  if (role && views[role]) return views[role];
  return fallback;
}
