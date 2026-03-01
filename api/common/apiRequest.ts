// Common API utility for HTTP requests with type safety
import { ApiRequestOptions, ApiResponse } from '@/types/api.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body } = options;

  // Allow callers to pass a full URL (http://...) or just a path (/api/...)
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, fetchOptions);
  const json = await response.json();

  if (!response.ok) {
    // Backend wraps errors as { success: false, error: '...' }
    // Fallback to json.message for forward-compat with other APIs
    throw new Error(json.error ?? json.message ?? 'API Error');
  }

  // Backend wraps successes as { success: true, data: T }
  // Unwrap so callers receive T directly in ApiResponse.data
  const data: T = json.data !== undefined ? json.data : json;

  return { data, status: response.status };
}
