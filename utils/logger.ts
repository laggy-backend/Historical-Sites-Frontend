/**
 * Centralized logging utility
 * Provides structured logging with different levels and contexts
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = 'auth' | 'api' | 'theme' | 'navigation' | 'general';

interface LogEntry {
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  private formatMessage(level: LogLevel, context: LogContext, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

    if (data) {
      return `${prefix} ${message} - Data: ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private log(level: LogLevel, context: LogContext, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, context, message, data);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }

    // In production, you could send to external logging service here
    // if (!this.isDevelopment) {
    //   this.sendToExternalService({ level, context, message, data, timestamp: new Date().toISOString() });
    // }
  }

  debug(context: LogContext, message: string, data?: any): void {
    this.log('debug', context, message, data);
  }

  info(context: LogContext, message: string, data?: any): void {
    this.log('info', context, message, data);
  }

  warn(context: LogContext, message: string, data?: any): void {
    this.log('warn', context, message, data);
  }

  error(context: LogContext, message: string, data?: any): void {
    this.log('error', context, message, data);
  }

  // Convenience methods for common auth scenarios
  authSuccess(action: string, userId?: number): void {
    this.info('auth', `${action} successful`, { userId });
  }

  authFailure(action: string, error: string, email?: string): void {
    this.warn('auth', `${action} failed: ${error}`, { email });
  }

  // Convenience methods for API scenarios
  apiRequest(method: string, url: string, status?: number): void {
    this.debug('api', `${method} ${url}`, { status });
  }

  apiError(method: string, url: string, error: string, status?: number): void {
    this.error('api', `${method} ${url} failed: ${error}`, { status });
  }

  // Private method for future external service integration
  // private async sendToExternalService(entry: LogEntry): Promise<void> {
  //   // Implementation for Sentry, LogRocket, etc.
  // }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;