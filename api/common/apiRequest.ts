// Common API utility for HTTP requests with type safety
import { ApiRequestOptions, ApiResponse } from '@/types/api.types';
import { logger } from '@/lib/logger';
import { sanitizeError } from '@/utils/error-sanitizer';
import { showMessage } from 'react-native-flash-message';

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

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        logger.info(`Retrying ${method} ${path} (Attempt ${attempt}/${retries}) in ${backoff}ms...`);
        await delay(backoff);
      }

      const response = await fetch(url, fetchOptions);
      
      let json: any = {};
      const text = await response.text();
      
      if (text) {
        try {
          json = JSON.parse(text);
        } catch (e) {
          if (response.ok) {
            throw new Error(`Invalid JSON response (HTTP ${response.status})`);
          }
        }
      }

      if (!response.ok && response.status !== 304) {
        const errorMsg = json.error ?? json.message ?? `HTTP ${response.status}`;
        throw { message: errorMsg, status: response.status, data: json };
      }

      const data: T = json.data !== undefined ? json.data : json;
      return { data: (data === undefined ? {} : data) as T, status: response.status };

    } catch (err: any) {
      lastError = err;
      
      // If it's the last attempt, handle the error gracefully or notify the user
      if (attempt === retries) {
        const sanitized = sanitizeError(err);
        
        logger.error(`API Request Failed: ${method} ${path}`, err, { sanitized });

        if (skeletonFallback !== undefined) {
          logger.warn(`Using skeletonFallback for ${method} ${path}`);
          return { data: skeletonFallback as T, status: err.status || 503 };
        }

        // Show toast notification
        showMessage({
          message: sanitized.message,
          type: 'danger',
          icon: 'danger',
          duration: 4000,
        });

        // Re-throw with sanitization info
        throw { ...err, message: sanitized.message, raw: err };
      }
    }
  }

  throw lastError;
}
