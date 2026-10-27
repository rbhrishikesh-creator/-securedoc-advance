import { Request, Response, NextFunction } from 'express';
import { cacheStore } from '../config/redis';

/**
 * Creates a rate limiting middleware backed by Redis / atomic cacheStore
 * @param prefix Redis key prefix
 * @param maxRequests Maximum allowed requests in the time window
 * @param windowSeconds Window length in seconds
 */
export function createRateLimiter(prefix: string, maxRequests: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
      const key = `ratelimit:${prefix}:${ip}`;

      const count = await cacheStore.incr(key);
      if (count === 1) {
        // Set TTL on the first request in the window
        await cacheStore.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: `Too many requests for ${prefix}. Please try again in a few minutes.`,
          retryAfterSeconds: windowSeconds,
        });
        return;
      }

      next();
    } catch {
      // In case of unexpected cache store glitch, do not block user
      next();
    }
  };
}

export const loginRateLimiter = createRateLimiter('login', 5, 900); // 5 attempts per 15 minutes
export const emailVerificationRateLimiter = createRateLimiter('verify_email', 3, 900); // 3 resend attempts per 15 minutes
export const passwordResetRateLimiter = createRateLimiter('reset_pwd', 3, 900); // 3 attempts per 15 minutes
