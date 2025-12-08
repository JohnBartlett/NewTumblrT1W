/**
 * Client-side Rate Limiter
 * Prevents hammering APIs after receiving 429 responses
 */

interface RateLimitState {
  retryAfter: number; // Timestamp when we can retry
  failureCount: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Check if a request should be blocked due to rate limiting
 */
export function isRateLimited(key: string): boolean {
  const state = rateLimitStates.get(key);
  if (!state) return false;

  const now = Date.now();
  if (now < state.retryAfter) {
    console.warn(`[Rate Limiter] ⏳ Request to ${key} blocked. Retry after ${Math.ceil((state.retryAfter - now) / 1000)}s`);
    return true;
  }

  // Reset if we're past the retry time
  rateLimitStates.delete(key);
  return false;
}

/**
 * Record a 429 rate limit response
 */
export function recordRateLimit(key: string, retryAfterSeconds?: number): void {
  const state = rateLimitStates.get(key) || { retryAfter: 0, failureCount: 0 };
  
  state.failureCount++;
  
  // Use provided retry-after or calculate exponential backoff
  // Start with 30s, double each time (30s, 60s, 120s, 240s, max 5 minutes)
  const backoffSeconds = retryAfterSeconds || Math.min(30 * Math.pow(2, state.failureCount - 1), 300);
  state.retryAfter = Date.now() + (backoffSeconds * 1000);
  
  rateLimitStates.set(key, state);
  
  console.warn(
    `[Rate Limiter] 🚫 Rate limited: ${key}. Backing off for ${backoffSeconds}s (attempt ${state.failureCount})`
  );
}

/**
 * Get time remaining until retry is allowed (in seconds)
 */
export function getRetryAfter(key: string): number {
  const state = rateLimitStates.get(key);
  if (!state) return 0;

  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((state.retryAfter - now) / 1000));
  return remaining;
}

/**
 * Clear rate limit for a key (use after successful request)
 */
export function clearRateLimit(key: string): void {
  rateLimitStates.delete(key);
}

/**
 * Get all active rate limits (for debugging)
 */
export function getActiveLimits(): Array<{ key: string; retryAfter: number; failureCount: number }> {
  const now = Date.now();
  const active: Array<{ key: string; retryAfter: number; failureCount: number }> = [];
  
  for (const [key, state] of rateLimitStates.entries()) {
    if (state.retryAfter > now) {
      active.push({
        key,
        retryAfter: Math.ceil((state.retryAfter - now) / 1000),
        failureCount: state.failureCount
      });
    }
  }
  
  return active;
}

