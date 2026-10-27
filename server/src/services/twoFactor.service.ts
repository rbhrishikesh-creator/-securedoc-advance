import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { cacheStore } from '../config/redis';

export interface TOTPSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface BackupCodesResult {
  plaintextCodes: string[];
  hashedCodes: string[];
}

const RFC4648_BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += RFC4648_BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += RFC4648_BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32Str: string): Buffer {
  const cleaned = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const val = RFC4648_BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Computes RFC 6238 TOTP for a given 8-byte counter buffer and secret key buffer.
 */
function computeHOTP(secretBuffer: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

export class TwoFactorService {
  /**
   * Generates a new Base32 TOTP secret, otpauth URI, and QR Code Data URL.
   */
  static async generateTOTPSecret(userEmail: string): Promise<TOTPSetupResult> {
    // 20 random bytes = 160 bits (RFC 6238 recommendation)
    const randomBytes = crypto.randomBytes(20);
    const secret = base32Encode(randomBytes);
    const serviceName = 'SecureDoc Advanced';

    const otpauthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}&algorithm=SHA1&digits=6&period=30`;

    // High-resolution QR code Data URL for mobile authenticator scanning
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  /**
   * Generates the current TOTP token for a given secret (useful for testing or verification).
   */
  static generateCurrentTOTP(secret: string, offsetSteps: number = 0): string {
    const secretBuffer = base32Decode(secret);
    const currentCounter = Math.floor(Date.now() / 1000 / 30) + offsetSteps;
    return computeHOTP(secretBuffer, currentCounter);
  }

  /**
   * Verifies a 6-digit TOTP token against the user's secret with +/- 6 time-step drift (390-second total validity window)
   * to accommodate realistic clock drift between mobile devices and servers.
   */
  static verifyTOTP(token: string, secret: string, windowSteps: number = 6): boolean {
    const cleanToken = token.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    try {
      const secretBuffer = base32Decode(secret);
      const currentCounter = Math.floor(Date.now() / 1000 / 30);

      // Check current time step and +/- windowSteps to accommodate clock drift between mobile and server
      for (let offset = -windowSteps; offset <= windowSteps; offset++) {
        const candidate = computeHOTP(secretBuffer, currentCounter + offset);
        if (candidate === cleanToken) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generates single-use backup recovery codes (formatted e.g. "A8B2-9F1C")
   */
  static async generateBackupCodes(count: number = 8): Promise<BackupCodesResult> {
    const plaintextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}`;
      plaintextCodes.push(code);

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(code, salt);
      hashedCodes.push(hash);
    }

    return {
      plaintextCodes,
      hashedCodes,
    };
  }

  /**
   * Verifies candidate backup code against hashed list.
   * Returns index of the matched code, or -1 if no match.
   */
  static async verifyBackupCode(candidate: string, hashedCodes: string[]): Promise<number> {
    const cleanCandidate = candidate.trim().toUpperCase();
    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(cleanCandidate, hashedCodes[i]);
      if (match) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Generates a 6-digit numeric OTP for email fallback, stored in Redis/cache with 10-min TTL.
   */
  static async generateEmailOTP(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const cacheKey = `2fa:email:${userId}`;
    await cacheStore.set(cacheKey, code, 'EX', 600); // 10 minutes
    return code;
  }

  /**
   * Atomically verifies and consumes the 6-digit email OTP.
   */
  static async verifyEmailOTP(userId: string, candidateOtp: string): Promise<boolean> {
    const cacheKey = `2fa:email:${userId}`;
    const stored = await cacheStore.getdel(cacheKey);
    if (!stored) return false;
    return stored.trim() === candidateOtp.trim();
  }
}
