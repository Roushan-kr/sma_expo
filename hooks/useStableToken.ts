/**
 * useStableToken
 *
 * Returns a stable `getToken` function that:
 *  1. Does NOT cause re-renders or useCallback re-computations when
 *     Clerk's internal `getToken` reference changes.
 *  2. Caches the token in memory for 50 s — Clerk tokens last 60 s,
 *     so this avoids hammering the Clerk endpoint on every screen fetch.
 *  3. Deduplicates concurrent requests (one in-flight promise max).
 *
 * Usage:
 *   const getToken = useStableToken();
 *   const token = await getToken();          // 'Bearer xxx...' or null
 */
import { useAuth } from '@clerk/clerk-expo';
import { useRef, useCallback } from 'react';

const CACHE_TTL_MS = 50_000; // 50 s (tokens expire at 60 s)

interface TokenCache {
  token: string;
  expiresAt: number;
}

// Module-level cache so it's shared across hook instances on the same screen tree
let tokenCache: TokenCache | null = null;
let inflight: Promise<string | null> | null = null;

export function useStableToken() {
  const { getToken: clerkGetToken } = useAuth();

  // Keep the latest Clerk getToken in a ref so our stable wrapper never
  // captures a stale closure — without appearing in any dep array.
  const clerkGetTokenRef = useRef(clerkGetToken);
  clerkGetTokenRef.current = clerkGetToken;

  const getToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();

    // Return cached token if still valid
    if (tokenCache && now < tokenCache.expiresAt) {
      return tokenCache.token;
    }

    // Deduplicate: if there's already a request in-flight, wait for it
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const token = await clerkGetTokenRef.current();
        if (token) {
          tokenCache = { token, expiresAt: now + CACHE_TTL_MS };
        }
        return token;
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  }, []); // ← intentionally empty: stability is provided by the ref

  return getToken;
}

/** Call this on sign-out to purge the cached token. */
export function clearTokenCache() {
  tokenCache = null;
  inflight = null;
}
