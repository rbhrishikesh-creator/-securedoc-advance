import { CryptoService } from '../src/services/crypto.service';

describe('CryptoService (AES-256-GCM Security Engine)', () => {
  it('should encrypt plaintext buffer and produce unique IV and 16-byte auth tag', () => {
    const message = Buffer.from('Confidential executive report - Internal only 2026', 'utf-8');
    const result1 = CryptoService.encrypt(message);
    const result2 = CryptoService.encrypt(message);

    expect(result1.ciphertext).toBeDefined();
    expect(result1.ivHex).toHaveLength(24); // 12 bytes * 2
    expect(result1.authTagHex).toHaveLength(32); // 16 bytes * 2
    expect(result1.checksum).toBeDefined();

    // Independent random IVs produce distinct ciphertexts for identical plaintext
    expect(result1.ivHex).not.toEqual(result2.ivHex);
    expect(result1.ciphertext).not.toEqual(result2.ciphertext);
  });

  it('should decrypt ciphertext correctly and verify checksum integrity', () => {
    const raw = 'Top Secret Specification: Quantum resistant keys';
    const message = Buffer.from(raw, 'utf-8');

    const encrypted = CryptoService.encrypt(message);
    const decrypted = CryptoService.decrypt(
      encrypted.ciphertext,
      encrypted.ivHex,
      encrypted.authTagHex,
      encrypted.checksum
    );

    expect(decrypted.toString('utf-8')).toEqual(raw);
  });

  it('should detect tampering when ciphertext or auth tag is corrupted', () => {
    const message = Buffer.from('Tamper-test sensitive file payload', 'utf-8');
    const encrypted = CryptoService.encrypt(message);

    // Corrupt ciphertext
    const corruptedCiphertext = Buffer.from(encrypted.ciphertext);
    corruptedCiphertext[0] ^= 0xff;

    expect(() => {
      CryptoService.decrypt(
        corruptedCiphertext,
        encrypted.ivHex,
        encrypted.authTagHex,
        encrypted.checksum
      );
    }).toThrow();
  });
});
