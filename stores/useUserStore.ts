import { create } from 'zustand';

import { api } from '@/lib/api';
import type {
  Consumer,
  User,
  ROLE_TYPE as ApiRoleType,
} from '../types/api.types';

// ─── Enums (match Prisma schema exactly) ──────────────────────────────────────

// Use RoleType from API types for consistency
export type RoleType = ApiRoleType;

// ─── Types ────────────────────────────────────────────────────────────────────

// UserProfile is now based on Consumer from API types
export interface UserProfile extends Consumer {
  clerkUserId?: string | null;
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
