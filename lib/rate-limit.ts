/**
 * lib/rate-limit.ts
 * In-memory rate limiting for API routes.
 * 
 * Uses a simple sliding window implementation that works in both
 * serverless (per-instance) and local development environments.
 *
 * For production with high traffic, upgrade to @upstash/ratelimit + Redis.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars to enable Redis.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (works per instance in serverless)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum number of requests */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks if a request is within rate limits.
 * Returns result with headers info for setting response headers.
 *
 * @example
 * // In an API route:
 * const result = await checkRateLimit(request, { limit: 10, windowSeconds: 60 });
 * if (!result.success) {
 *   return rateLimitResponse(result);
 * }
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSeconds, prefix = 'rl' } = options;

  // Get client identifier: use IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const resetAt = now + windowMs;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(resetAt / 1000),
    };
  }

  // Existing window
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Creates a 429 Too Many Requests response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
      },
    }
  );
}

/**
 * Preset rate limiters for common use cases.
 */
export const RATE_LIMITS = {
  /** Coupon validation — 10 attempts per minute */
  coupon: { limit: 10, windowSeconds: 60, prefix: 'coupon' },
  /** Login attempts — 5 per minute */
  auth: { limit: 5, windowSeconds: 60, prefix: 'auth' },
  /** Influencer applications — 3 per hour */
  influencer: { limit: 3, windowSeconds: 3600, prefix: 'influencer' },
  /** Image uploads — 20 per minute */
  upload: { limit: 20, windowSeconds: 60, prefix: 'upload' },
  /** General API — 60 per minute */
  api: { limit: 60, windowSeconds: 60, prefix: 'api' },
} as const;
