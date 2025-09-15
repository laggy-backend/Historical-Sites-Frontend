/**
 * Request retry utility
 * Provides controlled retry logic with exponential backoff
 */

import { logger } from './logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number;  // Maximum delay in milliseconds
  backoffFactor: number; // Exponential backoff multiplier
  retryableErrors: string[]; // Error codes that should trigger retry
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000,  // 10 seconds
  backoffFactor: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'UNAUTHORIZED'], // 401 for token refresh
};

export class RetryManager {
  private retryAttempts: Map<string, number> = new Map();
  private isRetrying: Map<string, boolean> = new Map();

  /**
   * Calculate delay for retry attempt using exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: any, config: RetryConfig): boolean {
    if (error.response?.status === 401) return true; // Token refresh scenario
    if (error.code && config.retryableErrors.includes(error.code)) return true;
    if (error.message && error.message.includes('Network Error')) return true;
    return false;
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    key: string,
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    // Prevent concurrent retries for the same key
    if (this.isRetrying.get(key)) {
      throw new Error(`Retry already in progress for ${key}`);
    }

    const currentAttempts = this.retryAttempts.get(key) || 0;

    if (currentAttempts >= config.maxAttempts) {
      logger.error('api', `Max retry attempts exceeded for ${key}`, {
        attempts: currentAttempts,
        maxAttempts: config.maxAttempts
      });
      throw new Error(`Max retry attempts exceeded for ${key}`);
    }

    try {
      this.isRetrying.set(key, true);
      this.retryAttempts.set(key, currentAttempts + 1);

      logger.debug('api', `Attempt ${currentAttempts + 1} for ${key}`);

      const result = await fn();

      // Success - reset counters
      this.retryAttempts.delete(key);
      this.isRetrying.delete(key);

      logger.debug('api', `Success for ${key} after ${currentAttempts + 1} attempts`);
      return result;

    } catch (error) {
      this.isRetrying.delete(key);

      if (!this.isRetryableError(error, config) || currentAttempts >= config.maxAttempts - 1) {
        // Not retryable or max attempts reached
        this.retryAttempts.delete(key);
        logger.error('api', `Final failure for ${key}`, {
          error: (error as Error).message,
          attempts: currentAttempts + 1
        });
        throw error;
      }

      // Calculate delay and retry
      const delay = this.calculateDelay(currentAttempts + 1, config);
      logger.warn('api', `Retrying ${key} in ${delay}ms`, {
        attempt: currentAttempts + 1,
        error: (error as Error).message
      });

      await this.delay(delay);
      return this.executeWithRetry(key, fn, config);
    }
  }

  /**
   * Reset retry count for a specific key
   */
  resetRetryCount(key: string): void {
    this.retryAttempts.delete(key);
    this.isRetrying.delete(key);
  }

  /**
   * Check if currently retrying a specific key
   */
  isCurrentlyRetrying(key: string): boolean {
    return this.isRetrying.get(key) || false;
  }

  /**
   * Get current retry count for a key
   */
  getRetryCount(key: string): number {
    return this.retryAttempts.get(key) || 0;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all retry states (useful for testing or reset scenarios)
   */
  clearAll(): void {
    this.retryAttempts.clear();
    this.isRetrying.clear();
  }
}

// Export singleton instance
export const retryManager = new RetryManager();

// Export default for convenience
export default retryManager;