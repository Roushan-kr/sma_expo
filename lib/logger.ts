/**
 * Centralized logging utility for the frontend.
 * In development, it logs to the console with formatting.
 * In production, it could be extended to send logs to a service (e.g., Sentry, LogRocket).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDev = __DEV__;

  private format(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return { prefix, message, data };
  }

  info(message: string, data?: any) {
    const { prefix, message: msg, data: d } = this.format('info', message, data);
    if (this.isDev) {
      console.log(`${prefix} ${msg}`, d ?? '');
    }
  }

  warn(message: string, data?: any) {
    const { prefix, message: msg, data: d } = this.format('warn', message, data);
    if (this.isDev) {
      console.warn(`${prefix} ${msg}`, d ?? '');
    }
  }

  error(message: string, error?: any, context?: any) {
    const { prefix, message: msg } = this.format('error', message);
    if (this.isDev) {
      console.error(`${prefix} ${msg}`, error ?? '', context ?? '');
    }
    // TODO: Send to external monitoring service in production
  }

  debug(message: string, data?: any) {
    if (this.isDev) {
      const { prefix, message: msg, data: d } = this.format('debug', message, data);
      console.debug(`${prefix} ${msg}`, d ?? '');
    }
  }
}

export const logger = new Logger();
