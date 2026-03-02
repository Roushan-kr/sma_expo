import { create } from 'zustand';
import { apiRequest } from '@/api/common/apiRequest';
import type { SmartMeter } from '@/types/api.types';
import { logger } from '@/lib/logger';

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
    if (get().loading) return;

    set({ loading: true, error: null });
    
    try {
      const { data } = await apiRequest<SmartMeter[]>('/api/smart-meters/my-meters', {
        headers: { Authorization: `Bearer ${token}` },
        skeletonFallback: [],
      });
      set({ meters: data, loading: false });
      logger.info('Meters loaded successfully');
    } catch (err: any) {
      set({ 
        error: err?.message || 'Failed to load meters', 
        loading: false 
      });
    }
  },

  clearMeters: () => set({ meters: [], error: null, loading: false }),
}));
