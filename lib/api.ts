import axios from 'axios';
import { logger } from './logger';
import { sanitizeError } from '@/utils/error-sanitizer';
import { showMessage } from 'react-native-flash-message';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const sanitized = sanitizeError(error);
    
    logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error, { sanitized });

    // Global toast for errors (unless explicitly disabled)
    if (error.config?.headers?.silent !== true) {
      showMessage({
        message: sanitized.message,
        type: 'danger',
        icon: 'danger',
        duration: 4000,
      });
    }

    return Promise.reject({ ...error, sanitizedMessage: sanitized.message });
  }
);

export async function syncUser(clerkToken: string) {
  const response = await api.post(
    '/auth/sync',
    {},
    {
      headers: { Authorization: `Bearer ${clerkToken}` },
    }
  );
  return response.data;
}
