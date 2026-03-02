import { create } from 'zustand';
import { apiRequest } from '@/api/common/apiRequest';
import type { SmartMeter } from '@/types/api.types';

export interface MeterStoreState {
  meters: SmartMeter[];
  loading: boolean;
  error: string | null;
  loadMeters: (token: string) => Promise<void>;
  clearMeters: () => void;
}

export const useMeterStore = create<MeterStoreState>((set, get) => ({
  meters: [],
  loading: false,
  error: null,

  loadMeters: async (token: string) => {
    // Avoid re-fetching if already loading
    if (get().loading) return;

    set({ loading: true, error: null });
    
    try {
      const { data } = await apiRequest<SmartMeter[]>('/api/smart-meters', {
        headers: { Authorization: `Bearer ${token}` },
        // Return an empty array on failure instead of throwing to avoid UI crashes
        skeletonFallback: [],
      });
      set({ meters: data, loading: false });
    } catch (err: any) {
      // With retries and skeletonFallback, it should rarely reach here
      // unless skeletonFallback is explicitly undefined.
      set({ 
        error: err?.message || 'Failed to load meters', 
        loading: false 
      });
    }
  },

  clearMeters: () => set({ meters: [], error: null, loading: false }),
}));
