/**
 * Authentication Event System
 * Provides a way for the API client to communicate with AuthContext
 * when authentication fails without creating circular dependencies
 */

import { logger } from '../utils/logger';

type AuthEventType = 'FORCE_LOGOUT' | 'TOKEN_REFRESHED' | 'AUTH_ERROR';

interface AuthEvent {
  type: AuthEventType;
  data?: any;
  timestamp: number;
}

class AuthEventManager {
  private listeners: Map<AuthEventType, Set<(data?: any) => void>> = new Map();

  /**
   * Subscribe to authentication events
   */
  on(eventType: AuthEventType, callback: (data?: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit authentication event
   */
  emit(eventType: AuthEventType, data?: any): void {
    const event: AuthEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    logger.debug('events', `Emitting auth event: ${eventType}`, { data, timestamp: event.timestamp });

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error in auth event listener';
          logger.error('events', `Error in auth event listener for ${eventType}`, {
            error: errorMessage,
            eventType
          });
        }
      });
    }
  }

  /**
   * Force logout - used when tokens are invalid/expired
   */
  forceLogout(reason: string = 'Authentication failed'): void {
    this.emit('FORCE_LOGOUT', { reason });
  }

  /**
   * Notify successful token refresh
   */
  tokenRefreshed(tokens: { access: string; refresh: string }): void {
    this.emit('TOKEN_REFRESHED', tokens);
  }

  /**
   * Notify authentication error
   */
  authError(error: string): void {
    this.emit('AUTH_ERROR', { error });
  }

  /**
   * Clear all listeners (useful for cleanup)
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const authEvents = new AuthEventManager();
export type { AuthEventType };
