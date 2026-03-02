import { create } from 'zustand';
import { api } from '@/lib/api';

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
  consumer: {
    name: string;
  };
}

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
      const url = status ? `/api/queries?status=${status}` : '/api/queries';
      const { data } = await api.get<{ data: CustomerQuery[] }>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ queries: data.data || [] });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || err.message || 'Failed to fetch queries' });
    } finally {
      set({ loading: false });
    }
  },

  fetchQueryById: async (token, id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<CustomerQuery>(`/api/queries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ selectedQuery: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || err.message || 'Failed to fetch query' });
    } finally {
      set({ loading: false });
    }
  },

  approveAI: async (token, id) => {
    set({ loading: true, error: null });
    try {
      // The AI process uses auto-resolve internally if confidence > 0.85, 
      // but if a human approves an ALREADY classified ticket, they just
      // submit it back via the reply endpoint using the suggestion text,
      // or we can hit the status endpoint.
      // Wait, let's use the explicit `reply` endpoint, which auto-resolves.
      const query = get().selectedQuery;
      if (!query || !query.adminReply) throw new Error("No AI suggestion to approve");

      await api.patch(`/api/queries/${id}/reply`, { reply: query.adminReply }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update
      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'RESOLVED' } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'RESOLVED' } : q)
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message || err.message || 'Failed to approve AI' });
    } finally {
      set({ loading: false });
    }
  },

  resolveWithEdit: async (token, id, reply) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/api/queries/${id}/reply`, { reply }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'RESOLVED', adminReply: reply } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'RESOLVED', adminReply: reply } : q)
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message || err.message || 'Failed to resolve query' });
    } finally {
      set({ loading: false });
    }
  },

  rejectQuery: async (token, id) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/api/queries/${id}/status`, { status: 'REJECTED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      set(state => ({
        selectedQuery: state.selectedQuery ? { ...state.selectedQuery, status: 'REJECTED' } : null,
        queries: state.queries.map(q => q.id === id ? { ...q, status: 'REJECTED' } : q)
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message || err.message || 'Failed to reject query' });
    } finally {
      set({ loading: false });
    }
  },
}));
