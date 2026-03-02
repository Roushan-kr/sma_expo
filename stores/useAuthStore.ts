import { create } from 'zustand';
import { apiRequest } from '@/api/common/apiRequest';
import { ROLE_TYPE, User, Consumer } from '@/types/api.types';
import { logger } from '@/lib/logger';

export type AppRole = ROLE_TYPE | 'CONSUMER';

interface AuthState {
  profile: User | Consumer | null;
  role: AppRole | null;
  loading: boolean;
  error: string | null;
  isLoaded: boolean;

  syncProfile: (token: string) => Promise<void>;
  updateProfile: (input: Partial<User | Consumer>, token: string) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  role: null,
  loading: false,
  error: null,
  isLoaded: false,

  syncProfile: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest('/api/auth/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { role, profile } = response.data;
      
      set({ 
        role, 
        profile, 
        loading: false, 
        isLoaded: true 
      });
      logger.info('Auth profile synced successfully', { role });
    } catch (err: any) {
      set({ 
        error: err?.message || 'Failed to sync auth profile', 
        loading: false,
        isLoaded: true
      });
    }
  },

  updateProfile: async (input: Partial<User | Consumer>, token: string) => {
    set({ loading: true, error: null });
    try {
      const isConsumer = useAuthStore.getState().role === 'CONSUMER';
      const endpoint = isConsumer ? '/api/consumers/me' : '/api/users/me';
      
      const response = await apiRequest(endpoint, {
        method: 'PATCH',
        body: input,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ 
        profile: response.data, 
        loading: false 
      });
      logger.info('Profile updated successfully');
    } catch (err: any) {
      set({ 
        error: err?.message || 'Failed to update profile', 
        loading: false 
      });
      throw err;
    }
  },

  clearAuth: () => set({ 
    profile: null, 
    role: null, 
    error: null, 
    loading: false,
    isLoaded: false
  }),
}));
