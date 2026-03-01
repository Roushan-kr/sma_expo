import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';

export function useAdminAuthSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const loadProfile = useUserStore((s) => s.loadProfile);
  const clearProfile = useUserStore((s) => s.clearProfile);

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((token) => {
        if (token) loadProfile(token);
      });
    } else {
      clearProfile();
    }
    // Only run on sign-in/sign-out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id]);
}
