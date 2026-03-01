import { ROLE_TYPE } from '@/types/api.types';
import { useUserStore } from '@/stores/useUserStore';
import { useConsumerProfileStore } from '@/stores/useConsumerProfileStore';

// Extend the role union with 'CONSUMER' as a UI-only virtual role.
// Backend only has SUPER_ADMIN | STATE_ADMIN | BOARD_ADMIN | SUPPORT_AGENT | AUDITOR.
// Consumers are a separate model — we use this string to identify them in the UI.
export type AppRole = ROLE_TYPE | 'CONSUMER';

export function useCurrentRole(): AppRole | null {
  const adminProfile = useUserStore((s) => s.profile);
  const consumerProfile = useConsumerProfileStore((s) => s.profile);

  // Admin role comes from their User.role field (synced from /api/users/me)
  if (adminProfile?.role) return adminProfile.role as AppRole;

  // Consumer presence means they are a CONSUMER role in the UI
  if (consumerProfile) return 'CONSUMER';

  return null;
}

export function useRoleBasedView<T>(
  views: Partial<Record<AppRole, T>>,
  fallback?: T,
): T | undefined {
  const role = useCurrentRole();
  if (role && views[role]) return views[role];
  return fallback;
}
