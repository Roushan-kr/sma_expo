// Common API utility for HTTP requests with type safety
import { ApiRequestOptions, ApiResponse } from '@/types/api.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { 
    method = 'GET', 
    headers = {}, 
    body,
    retries = 3,
    retryDelayMs = 500,
    skeletonFallback
  } = options;

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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 500ms -> 1000ms -> 2000ms
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`[apiRequest] Retrying ${method} ${path} (Attempt ${attempt}/${retries}) in ${backoff}ms...`);
        await delay(backoff);
      }

      const response = await fetch(url, fetchOptions);
      const json = await response.json();

      if (!response.ok) {
        // Backend wraps errors as { success: false, error: '...' }
        throw new Error(json.error ?? json.message ?? `HTTP ${response.status}`);
      }

      // Backend wraps successes as { success: true, data: T }
      const data: T = json.data !== undefined ? json.data : json;
      return { data, status: response.status };

    } catch (err: any) {
      lastError = err;
      // If it's the last attempt and we have a fallback, return it gracefully
      if (attempt === retries && skeletonFallback !== undefined) {
        console.warn(`[apiRequest] All retries failed for ${method} ${path}. Using skeletonFallback.`, err.message);
        return { data: skeletonFallback as T, status: 503 };
      }
    }
  }

  throw lastError;
}
