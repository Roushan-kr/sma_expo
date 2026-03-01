// User API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  User,
  CreateUserInput,
  UpdateRoleInput,
  UpdateScopeInput,
  UpdateConsentInput,
  UserConsent,
  ApiResponse,
} from '@/types/api.types';

const BASE = `/api/users`;

export const UserAPI = {
  // ── Own profile (signed-in admin) ──────────────────────────────────────────

  async getMe(token: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getMeConsents(token: string): Promise<ApiResponse<UserConsent[]>> {
    return apiRequest<UserConsent[]>(`${BASE}/me/consents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  async createUser(input: CreateUserInput, token: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async getUser(id: string, token: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateUserRole(
    id: string,
    input: UpdateRoleInput,
    token: string,
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE}/${id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async updateUserScope(
    id: string,
    input: UpdateScopeInput,
    token: string,
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE}/${id}/scope`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async deleteUser(id: string, token: string): Promise<ApiResponse<{ id: string }>> {
    return apiRequest<{ id: string }>(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Consents ───────────────────────────────────────────────────────────────

  async listUserConsents(id: string, token: string): Promise<ApiResponse<UserConsent[]>> {
    return apiRequest<UserConsent[]>(`${BASE}/${id}/consents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateUserConsent(
    id: string,
    input: UpdateConsentInput,
    token: string,
  ): Promise<ApiResponse<UserConsent>> {
    return apiRequest<UserConsent>(`${BASE}/${id}/consents`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },
};
