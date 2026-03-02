import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/lib/logger';

/**
 * Global component to synchronize Clerk authentication state with Zustand useAuthStore.
 * It handles:
 * 1. Syncing profile on sign-in.
 * 2. Clearing profile on sign-out.
 */
export function AuthHandler({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { profile, syncProfile, clearAuth, loading } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Sync profile if not already present and not currently loading
      if (!profile && !loading) {
        logger.info('AuthHandler: User signed in, triggering profile sync');
        getToken().then((token) => {
          if (token) {
            syncProfile(token);
          } else {
            logger.warn('AuthHandler: Signed in but could not get token');
          }
        }).catch((err) => {
          logger.error('AuthHandler: Failed to get token for sync', err);
        });
      }
    } else {
      // Clear store on sign-out if profile exists
      if (profile) {
        logger.info('AuthHandler: User signed out, clearing auth store');
        clearAuth();
      }
    }
  }, [isLoaded, isSignedIn, profile, loading, getToken, syncProfile, clearAuth]);

  return <>{children}</>;
}
