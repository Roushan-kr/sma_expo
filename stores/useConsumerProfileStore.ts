import { create } from 'zustand';
import { Consumer, ROLE_TYPE } from '@/types/api.types';
import { ConsumerAPI } from '@/api/consumer/consumerApi';

export interface ConsumerProfileState {
  profile: Consumer | null;
  loading: boolean;
  error: string | null;
  loadProfile: (token: string) => Promise<void>;
  updateProfile: (input: Partial<Consumer>, token: string) => Promise<void>;
  clearProfile: () => void;
}

export const useConsumerProfileStore = create<ConsumerProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  loadProfile: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await ConsumerAPI.getProfile(token);
      set({ profile: data, loading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load profile', loading: false });
    }
  },

  updateProfile: async (input, token) => {
    set({ loading: true, error: null });
    try {
      const { data } = await ConsumerAPI.updateProfile(input, token);
      set({ profile: data, loading: false });
    } catch (err: any) {
      set({
        error: err?.message || 'Failed to update profile',
        loading: false,
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null, loading: false }),
}));
