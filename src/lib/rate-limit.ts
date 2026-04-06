/**
 * Edge-compatible in-memory rate limiter.
 * Uses a module-level Map so state persists across requests within the same isolate.
 * Resets on cold start / new isolate — acceptable for abuse prevention, not for billing accuracy.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check and increment the rate limit counter for a given key.
 * @param key     Unique key (e.g., `${ip}:${routePrefix}`)
 * @param limit   Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 * @returns `{ ok: true }` if within limit, or `{ ok: false, retryAfter: seconds }` if exceeded
 */
export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until reset; 0 when ok=true
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }

  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}
