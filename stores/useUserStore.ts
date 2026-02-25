import { create } from 'zustand';
import { api } from '@/lib/api';

// ─── Enums (match Prisma schema exactly) ──────────────────────────────────────

export type RoleType =
  | 'SUPER_ADMIN'
  | 'STATE_ADMIN'
  | 'BOARD_ADMIN'
  | 'SUPPORT_AGENT'
  | 'AUDITOR';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Maps to the Consumer model (phone-based login users).
 * Clerk identity is stored as clerkUserId on Consumer, not User.
 */
export interface UserProfile {
  id: string;
  clerkUserId: string | null;
  name: string;
  phoneNumber: string | null; // Consumer.phoneNumber
  stateId: string;
  boardId: string;
  address: string;
  // Role is on the User model; for Consumer we expose it separately via /api/users/me
  role?: RoleType;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: (token: string) => Promise<void>;
  clearProfile: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<UserProfile>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ profile: data, loading: false });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load profile.';
      set({ error: message, loading: false });
    }
  },

  clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
