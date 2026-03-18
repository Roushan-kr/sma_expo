import { create } from "zustand";
import { apiRequest } from "@/api/common/apiRequest";
import { logger } from "@/lib/logger";

export type QueryStatus = "PENDING" | "AI_REVIEWED" | "RESOLVED" | "REJECTED";

export interface ConsumerQuery {
  id: string;
  consumerId: string;
  queryText: string;
  aiCategory: string | null;
  status: QueryStatus;
  adminReply: string | null;
  createdAt: string;
}

interface ConsumerSupportState {
  queries: ConsumerQuery[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchQueries: (token: string) => Promise<void>;
  createQuery: (token: string, message: string) => Promise<void>;
}

export const useConsumerSupportStore = create<ConsumerSupportState>(
  (set, get) => ({
    queries: [],
    loading: false,
    error: null,

    fetchQueries: async (token) => {
      set({ loading: true, error: null });
      try {
        const { data } = await apiRequest<{ data: ConsumerQuery[] }>(
          "/api/support/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // data.data is our array of queries based on standard api formatting
        set({ queries: data.data || [] });
      } catch (err: any) {
        set({ error: err.message || "Failed to load support history." });
      } finally {
        set({ loading: false });
      }
    },

    createQuery: async (token, message) => {
      set({ loading: true, error: null });
      try {
        await apiRequest("/api/support", {
          method: "POST",
          body: { queryText: message },
          headers: { Authorization: `Bearer ${token}` },
        });

        // re-fetch after creation
        await get().fetchQueries(token);
        logger.info("Support query created successfully");
      } catch (err: any) {
        set({ error: err.message || "Failed to submit query." });
        throw err;
      } finally {
        set({ loading: false });
      }
    },
  })
);
