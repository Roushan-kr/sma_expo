// Consumer API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  Consumer,
  CustomerConsent,
  RegisterConsumerInput,
  UpdateConsumerInput,
  ApiResponse,
} from '@/types/api.types';

const BASE = `/api/consumers`;

export const ConsumerAPI = {
  // ── Own profile (signed-in consumer) ──────────────────────────────────────

  async getProfile(token: string): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateProfile(
    input: UpdateConsumerInput,
    token: string,
  ): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE}/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async getMyConsents(token: string): Promise<ApiResponse<CustomerConsent[]>> {
    return apiRequest<CustomerConsent[]>(`${BASE}/me/consents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async grantConsent(
    consentType: 'ENERGY_TRACKING' | 'AI_QUERY_PROCESSING',
    token: string,
  ): Promise<ApiResponse<CustomerConsent>> {
    return apiRequest<CustomerConsent>(`${BASE}/me/consents/${consentType}/grant`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async revokeConsent(
    consentType: 'ENERGY_TRACKING' | 'AI_QUERY_PROCESSING',
    token: string,
  ): Promise<ApiResponse<CustomerConsent>> {
    return apiRequest<CustomerConsent>(`${BASE}/me/consents/${consentType}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Registration ───────────────────────────────────────────────────────────

  async register(
    input: RegisterConsumerInput,
    token: string,
  ): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  async getConsumer(id: string, token: string): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateConsumer(
    id: string,
    input: UpdateConsumerInput,
    token: string,
  ): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async deleteConsumer(id: string, token: string): Promise<ApiResponse<{ id: string }>> {
    return apiRequest<{ id: string }>(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
