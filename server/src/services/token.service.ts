import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { cacheStore } from '../config/redis';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

export class TokenService {
  /**
   * Generates a signed JWT session token
   */
  static generateJwt(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  /**
   * Verifies and decodes a JWT token
   */
  static verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  }

  /**
   * Generates a single-use cryptographically secure email verification token.
   * Stores the mapping in Redis with a 15-minute (900 seconds) expiration.
   */
  static async generateEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const key = `verify_email:${rawToken}`;
    // 24 hours TTL (86,400 seconds) so verification links don't expire prematurely
    await cacheStore.set(key, userId, 'EX', 86400);
    return rawToken;
  }

  /**
   * Atomically consumes the verification token.
   * Two concurrent calls cannot reuse the same token.
   */
  static async consumeEmailVerificationToken(token: string): Promise<string | null> {
    const key = `verify_email:${token}`;
    const userId = await cacheStore.getdel(key);
    return userId;
  }

  /**
   * Generates a single-use password reset token (15-minute TTL).
   */
  static async generatePasswordResetToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const key = `reset_pwd:${rawToken}`;
    await cacheStore.set(key, userId, 'EX', 900);
    return rawToken;
  }

  /**
   * Atomically consumes the password reset token.
   */
  static async consumePasswordResetToken(token: string): Promise<string | null> {
    const key = `reset_pwd:${token}`;
    const userId = await cacheStore.getdel(key);
    return userId;
  }

  /**
   * Generates a short-lived 2FA temporary authentication token (5 minutes).
   */
  static generateTwoFactorTempToken(userId: string): string {
    return jwt.sign({ userId, requires2FA: true }, config.jwtSecret, {
      expiresIn: '5m',
    });
  }

  /**
   * Verifies a 2FA temporary authentication token.
   */
  static verifyTwoFactorTempToken(tempToken: string): { userId: string } {
    const decoded = jwt.verify(tempToken, config.jwtSecret) as any;
    if (!decoded.requires2FA || !decoded.userId) {
      throw new Error('INVALID_2FA_TOKEN');
    }
    return { userId: decoded.userId };
  }
}

