/**
 * Utility to sanitize technical error messages into user-friendly strings.
 */

export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

const ERROR_MAP: Record<string, string> = {
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
  'TIMEOUT': 'The request took too long. Please try again.',
  'UNAUTHORIZED': 'Your session has expired. Please sign in again.',
  'FORBIDDEN': 'You do not have permission to perform this action.',
  'NOT_FOUND': 'The requested resource was not found.',
  'INTERNAL_SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
  'VALIDATION_ERROR': 'Please check the information you entered and try again.',
  'ECONNABORTED': 'Connection timed out. Please try again.',
  'ERR_NETWORK': 'Network error. Please check your connection.',
};

export function sanitizeError(error: any): { message: string; code: ErrorCode } {
  const rawMessage = error?.message || '';
  const rawCode = error?.code || '';

  // Handle Axios/Fetch specific errors
  if (rawCode === 'ECONNABORTED' || rawMessage.includes('timeout')) {
    return { message: ERROR_MAP['TIMEOUT'], code: 'TIMEOUT' };
  }
  if (rawCode === 'ERR_NETWORK' || rawMessage.includes('Network request failed')) {
    return { message: ERROR_MAP['NETWORK_ERROR'], code: 'NETWORK_ERROR' };
  }

  // Handle Backend Error Codes (if any)
  if (rawMessage.includes('401') || rawMessage.includes('Unauthorized')) {
    return { message: ERROR_MAP['UNAUTHORIZED'], code: 'UNAUTHORIZED' };
  }
  if (rawMessage.includes('403') || rawMessage.includes('Forbidden')) {
    return { message: ERROR_MAP['FORBIDDEN'], code: 'FORBIDDEN' };
  }
  if (rawMessage.includes('404')) {
    return { message: ERROR_MAP['NOT_FOUND'], code: 'NOT_FOUND' };
  }
  if (rawMessage.includes('500')) {
    return { message: ERROR_MAP['INTERNAL_SERVER_ERROR'], code: 'INTERNAL_SERVER_ERROR' };
  }

  // Fallback
  return { 
    message: rawMessage || 'An unexpected error occurred.', 
    code: 'UNKNOWN_ERROR' 
  };
}
