import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { useConsumerProfileStore } from '@/stores/useConsumerProfileStore';

export function useConsumerAuthSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const loadProfile = useConsumerProfileStore((s) => s.loadProfile);
  const clearProfile = useConsumerProfileStore((s) => s.clearProfile);

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
