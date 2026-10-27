import { TwoFactorService } from '../src/services/twoFactor.service';

describe('TwoFactorService (2-Step Verification Security Engine)', () => {
  it('should generate valid base32 TOTP secret, otpauth url, and high-res QR code data URL', async () => {
    const email = 'security.officer@securedoc.internal';
    const result = await TwoFactorService.generateTOTPSecret(email);

    expect(result.secret).toBeDefined();
    expect(result.secret.length).toBeGreaterThanOrEqual(16);
    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(result.otpauthUrl).toContain(encodeURIComponent(email));
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should accurately verify authentic 6-digit TOTP tokens and reject forged tokens', async () => {
    const setup = await TwoFactorService.generateTOTPSecret('user@example.com');
    const validToken = TwoFactorService.generateCurrentTOTP(setup.secret);

    // Authentic token generated for secret should pass
    expect(TwoFactorService.verifyTOTP(validToken, setup.secret)).toBe(true);

    // Token with +/- 1 time step drift should also pass
    const driftToken = TwoFactorService.generateCurrentTOTP(setup.secret, 1);
    expect(TwoFactorService.verifyTOTP(driftToken, setup.secret)).toBe(true);

    // Bad tokens should be rejected
    expect(TwoFactorService.verifyTOTP('000000', setup.secret)).toBe(false);
    expect(TwoFactorService.verifyTOTP('12345', setup.secret)).toBe(false);
    expect(TwoFactorService.verifyTOTP('abcdef', setup.secret)).toBe(false);
  });

  it('should generate 8 single-use recovery backup codes with bcrypt hashes', async () => {
    const { plaintextCodes, hashedCodes } = await TwoFactorService.generateBackupCodes(8);

    expect(plaintextCodes).toHaveLength(8);
    expect(hashedCodes).toHaveLength(8);

    // Each plaintext code format: XXXX-XXXX
    expect(plaintextCodes[0]).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);

    // Valid recovery code matches hashed entry
    const matchedIndex = await TwoFactorService.verifyBackupCode(plaintextCodes[2], hashedCodes);
    expect(matchedIndex).toBe(2);

    // Random non-existent code fails
    const invalidIndex = await TwoFactorService.verifyBackupCode('ZZZZ-9999', hashedCodes);
    expect(invalidIndex).toBe(-1);
  });

  it('should generate, verify, and atomically consume email OTP', async () => {
    const userId = 'usr_test_2fa_998877';
    const otp = await TwoFactorService.generateEmailOTP(userId);

    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);

    // First verification should pass
    const verified = await TwoFactorService.verifyEmailOTP(userId, otp);
    expect(verified).toBe(true);

    // Second verification should fail (atomic single-use replay protection)
    const replayed = await TwoFactorService.verifyEmailOTP(userId, otp);
    expect(replayed).toBe(false);
  });
});
