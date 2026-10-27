import crypto from 'crypto';
import { config } from '../config/env';

export interface EncryptedPayload {
  ciphertext: Buffer;
  ivHex: string;
  authTagHex: string;
  checksum: string;
}

export class CryptoService {
  private static masterKey: Buffer;

  private static getMasterKey(): Buffer {
    if (!this.masterKey) {
      const rawKey = config.encryptionMasterKey;
      if (rawKey.length === 64) {
        this.masterKey = Buffer.from(rawKey, 'hex');
      } else {
        // Derive 32-byte key using SHA-256
        this.masterKey = crypto.createHash('sha256').update(rawKey).digest();
      }
    }
    return this.masterKey;
  }

  /**
   * Encrypts plaintext buffer using AES-256-GCM.
   * Generates a unique 12-byte IV for every encryption operation.
   * Produces a 16-byte authentication tag and SHA-256 checksum for tamper-evident custody.
   */
  static encrypt(plaintext: Buffer): EncryptedPayload {
    const key = this.getMasterKey();
    // 12-byte IV is standard and recommended for AES-GCM
    const iv = crypto.randomBytes(12);

    // Compute SHA-256 of plaintext
    const checksum = crypto.createHash('sha256').update(plaintext).digest('hex');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
      checksum,
    };
  }

  /**
   * Decrypts ciphertext buffer using AES-256-GCM.
   * Verifies the 16-byte authentication tag and validates against the original SHA-256 checksum.
   */
  static decrypt(
    ciphertext: Buffer,
    ivHex: string,
    authTagHex: string,
    expectedChecksum?: string
  ): Buffer {
    const key = this.getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    if (expectedChecksum) {
      const actualChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');
      if (actualChecksum !== expectedChecksum) {
        throw new Error('Cryptographic integrity failure: Decrypted checksum does not match expected digest.');
      }
    }

    return decrypted;
  }
}
