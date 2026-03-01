// Billing API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  BillingReport,
  GenerateBillingInput,
  ApiResponse,
} from '@/types/api.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/billing`;

export const BillingAPI = {
  async generateBilling(
    input: GenerateBillingInput,
    token: string,
  ): Promise<ApiResponse<BillingReport>> {
    return apiRequest<BillingReport>(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  async getBillingReport(
    billId: string,
    token: string,
  ): Promise<ApiResponse<BillingReport>> {
    return apiRequest<BillingReport>(`${BASE_URL}/${billId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
