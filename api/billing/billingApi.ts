// Billing API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  BillingReport,
  GenerateBillingInput,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';

const BASE = `/api/billing`;

export const BillingAPI = {
  // ── Admin operations ───────────────────────────────────────────────────────

  async generateBilling(
    input: GenerateBillingInput,
    token: string,
  ): Promise<ApiResponse<BillingReport>> {
    return apiRequest<BillingReport>(`${BASE}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  /** Admin: get any bill by ID (admin scope-checked) */
  async getBillingReport(billId: string, token: string): Promise<ApiResponse<BillingReport>> {
    return apiRequest<BillingReport>(`${BASE}/${billId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Admin: list bills (paginated, filterable by meterId/consumerId) */
  async listBillingReports(
    params: { meterId?: string; consumerId?: string; page?: number; limit?: number },
    token: string,
  ): Promise<ApiResponse<PaginatedResponse<BillingReport>>> {
    const query = new URLSearchParams();
    if (params.meterId) query.set('meterId', params.meterId);
    if (params.consumerId) query.set('consumerId', params.consumerId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<PaginatedResponse<BillingReport>>(`${BASE}${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Consumer self-service ──────────────────────────────────────────────────

  /** Consumer: list all bills for their own meters */
  async getMyBills(
    params: { meterId?: string; page?: number; limit?: number },
    token: string,
  ): Promise<ApiResponse<PaginatedResponse<BillingReport>>> {
    const query = new URLSearchParams();
    if (params.meterId) query.set('meterId', params.meterId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<PaginatedResponse<BillingReport>>(`${BASE}/my-bills${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Consumer: view a specific bill they own */
  async getMyBillById(billId: string, token: string): Promise<ApiResponse<BillingReport>> {
    return apiRequest<BillingReport>(`${BASE}/my-bills/${billId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Consumer: record bill as viewed */
  async markBillViewed(billId: string, token: string): Promise<ApiResponse<{ id: string }>> {
    return apiRequest<{ id: string }>(`${BASE}/${billId}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
