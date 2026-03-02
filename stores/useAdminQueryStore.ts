import { create } from 'zustand';
import { apiRequest } from '@/api/common/apiRequest';
import { logger } from '@/lib/logger';

export type QueryStatus = 'PENDING' | 'AI_REVIEWED' | 'RESOLVED' | 'REJECTED';

export interface CustomerQuery {
  id: string;
  consumerId: string;
  queryText: string;
  aiCategory: string | null;
  aiConfidence: number | null;
  status: QueryStatus;
  adminReply: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  consumer?: {
    name: string;
    phoneNumber?: string;
  };
}

export const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#273549',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  text: '#f8fafc',
  muted: '#94a3b8',
  dim: '#475569',
};

export const STATUS_META: Record<QueryStatus, { label: string; bg: string; fg: string }> = {
  PENDING:     { label: 'Pending',     bg: '#f59e0b22', fg: C.amber },
  AI_REVIEWED: { label: 'AI Reviewed', bg: '#3b82f622', fg: C.blue },
  RESOLVED:    { label: 'Resolved',    bg: '#10b98122', fg: C.emerald },
  REJECTED:    { label: 'Rejected',    bg: '#f43f5e22', fg: C.rose },
};

interface AdminQueryState {
  queries: CustomerQuery[];
  selectedQuery: CustomerQuery | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchQueries: (token: string, status?: QueryStatus) => Promise<void>;
  fetchQueryById: (token: string, id: string) => Promise<void>;
  approveAI: (token: string, id: string) => Promise<void>;
  resolveWithEdit: (token: string, id: string, reply: string) => Promise<void>;
  rejectQuery: (token: string, id: string) => Promise<void>;
}

export const useAdminQueryStore = create<AdminQueryState>((set, get) => ({
  queries: [],
  selectedQuery: null,
  loading: false,
  error: null,

  fetchQueries: async (token, status) => {
    set({ loading: true, error: null });
    try {
      const path = status ? `/api/queries?status=${status}` : '/api/queries';
      const { data } = await apiRequest<{ data: CustomerQuery[] }>(path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ queries: data.data || [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch queries' });
    } finally {
      set({ loading: false });
    }
  },

  fetchQueryById: async (token, id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiRequest<CustomerQuery>(`/api/queries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ selectedQuery: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch query' });
    } finally {
      set({ loading: false });
    }
  },

  approveAI: async (token, id) => {
    set({ loading: true, error: null });
    try {
      const query = get().selectedQuery;
      if (!query || !query.adminReply) throw new Error("No AI suggestion to approve");

      await apiRequest(`/api/queries/${id}/reply`, {
        method: 'PATCH',
        body: { reply: query.adminReply },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update
      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'RESOLVED' } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'RESOLVED' } : q)
      }));
      logger.info('AI Review approved');
    } catch (err: any) {
      set({ error: err.message || 'Failed to approve AI' });
    } finally {
      set({ loading: false });
    }
  },

  resolveWithEdit: async (token, id, reply) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/api/queries/${id}/reply`, {
        method: 'PATCH',
        body: { reply },
        headers: { Authorization: `Bearer ${token}` }
      });

      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'RESOLVED', adminReply: reply } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'RESOLVED', adminReply: reply } : q)
      }));
      logger.info('Query resolved with edit');
    } catch (err: any) {
      set({ error: err.message || 'Failed to resolve query' });
    } finally {
      set({ loading: false });
    }
  },

  rejectQuery: async (token, id) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/api/queries/${id}/status`, {
        method: 'PATCH',
        body: { status: 'REJECTED' },
        headers: { Authorization: `Bearer ${token}` }
      });

      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'REJECTED' } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'REJECTED' } : q)
      }));
      logger.info('Query rejected');
    } catch (err: any) {
      set({ error: err.message || 'Failed to reject query' });
    } finally {
      set({ loading: false });
    }
  },
}));
