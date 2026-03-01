import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User, ROLE_TYPE as ApiRoleType } from '../types/api.types';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type RoleType = ApiRoleType;

// ─── Types ────────────────────────────────────────────────────────────────────

// UserProfile is the admin User model from the backend
export interface UserProfile extends User {
  clerkUserId?: string | null;
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
      // axios wraps response as { data: backendResponse }
      // backend wraps payload as  { success: true, data: user }
      // so we need response.data.data to get the actual User row
      const response = await api.get<{ success: boolean; data: UserProfile }>(
        '/api/users/me',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const user = response.data.data;
      set({ profile: user, loading: false });
    } catch (err: any) {
      // axios puts the parsed error JSON in err.response.data
      const message =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load profile.';
      set({ error: message, loading: false });
    }
  },

  clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
