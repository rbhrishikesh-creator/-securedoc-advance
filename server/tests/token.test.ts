import { TokenService } from '../src/services/token.service';

describe('TokenService (Atomic Single-Use Tokens & JWT)', () => {
  it('should generate and verify signed JWT session tokens', () => {
    const payload = {
      userId: '60d5ec49f1b2c8b1f8e4e1a1',
      email: 'officer@securedoc.internal',
      role: 'user' as const,
      isVerified: true,
    };

    const jwt = TokenService.generateJwt(payload);
    expect(jwt).toBeDefined();

    const decoded = TokenService.verifyJwt(jwt);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.isVerified).toBe(true);
  });

  it('should allow atomic single-use consumption of verification token and reject second reuse', async () => {
    const userId = '60d5ec49f1b2c8b1f8e4e1a2';
    const token = await TokenService.generateEmailVerificationToken(userId);

    // First consumption: success
    const consumed1 = await TokenService.consumeEmailVerificationToken(token);
    expect(consumed1).toBe(userId);

    // Second consumption (concurrent attack / replay): must return null
    const consumed2 = await TokenService.consumeEmailVerificationToken(token);
    expect(consumed2).toBeNull();
  });
});
