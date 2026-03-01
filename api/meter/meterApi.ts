// Smart Meter API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  SmartMeter,
  CreateMeterInput,
  AssignMeterInput,
  UpdateMeterStatusInput,
  ApiResponse,
} from '@/types/api.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/smart-meters`;

export const MeterAPI = {
  async createMeter(
    input: CreateMeterInput,
    token: string,
  ): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(BASE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async getMeter(id: string, token: string): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async assignMeter(
    meterId: string,
    input: AssignMeterInput,
    token: string,
  ): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE_URL}/${meterId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async updateMeterStatus(
    meterId: string,
    input: UpdateMeterStatusInput,
    token: string,
  ): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE_URL}/${meterId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },
};
