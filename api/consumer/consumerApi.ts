// Consumer API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  Consumer,
  RegisterConsumerInput,
  UpdateConsumerInput,
  ApiResponse,
} from '@/types/api.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/consumers`;

export const ConsumerAPI = {
  async register(input: RegisterConsumerInput): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE_URL}/register`, {
      method: 'POST',
      body: input,
    });
  },

  async getProfile(token: string): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async updateProfile(
    input: UpdateConsumerInput,
    token: string,
  ): Promise<ApiResponse<Consumer>> {
    return apiRequest<Consumer>(`${BASE_URL}/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },
};
