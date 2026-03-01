// User API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  User,
  CreateUserInput,
  UpdateRoleInput,
  UpdateScopeInput,
  ApiResponse,
} from '@/types/api.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/users`;

export const UserAPI = {
  async createUser(
    input: CreateUserInput,
    token: string,
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(BASE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async getUser(id: string, token: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateUserRole(
    id: string,
    input: UpdateRoleInput,
    token: string,
  ): Promise<ApiResponse<User>> {
    return apiRequest<User>(`${BASE_URL}/${id}/role`, {
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
    return apiRequest<User>(`${BASE_URL}/${id}/scope`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async deleteUser(
    id: string,
    token: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
