// Smart Meter API abstraction for Expo app
import { apiRequest } from '../common/apiRequest';
import type {
  SmartMeter,
  ConsumptionSummary,
  CreateMeterInput,
  AssignMeterInput,
  UpdateMeterStatusInput,
  ApiResponse,
} from '@/types/api.types';

const BASE = `/api/smart-meters`;

export const MeterAPI = {
  // ── Consumer self-service ──────────────────────────────────────────────────

  /** Consumer: list all meters belonging to the signed-in consumer */
  async getMyMeters(token: string): Promise<ApiResponse<SmartMeter[]>> {
    return apiRequest<SmartMeter[]>(`${BASE}/my-meters`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Consumer: get consumption summary for one of their own meters */
  async getMyMeterConsumption(
    meterId: string,
    periodStart: string,
    periodEnd: string,
    token: string,
  ): Promise<ApiResponse<ConsumptionSummary>> {
    return apiRequest<ConsumptionSummary>(
      `${BASE}/my-meters/${meterId}/consumption?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  /** Admin: create a new smart meter */
  async createMeter(input: CreateMeterInput, token: string): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  /** Admin: get a meter by ID */
  async getMeter(id: string, token: string): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Admin: get all meters for a specific consumer */
  async getMetersByConsumer(consumerId: string, token: string): Promise<ApiResponse<SmartMeter[]>> {
    return apiRequest<SmartMeter[]>(`${BASE}/consumer/${consumerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Admin: assign a meter to a different consumer */
  async assignMeter(
    meterId: string,
    input: AssignMeterInput,
    token: string,
  ): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE}/${meterId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  /** Admin: update meter status */
  async updateMeterStatus(
    meterId: string,
    input: UpdateMeterStatusInput,
    token: string,
  ): Promise<ApiResponse<SmartMeter>> {
    return apiRequest<SmartMeter>(`${BASE}/${meterId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: input,
    });
  },

  /** Admin: get consumption summary for any meter */
  async getConsumptionSummary(
    meterId: string,
    periodStart: string,
    periodEnd: string,
    token: string,
  ): Promise<ApiResponse<ConsumptionSummary>> {
    return apiRequest<ConsumptionSummary>(
      `${BASE}/${meterId}/consumption?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  },
};
