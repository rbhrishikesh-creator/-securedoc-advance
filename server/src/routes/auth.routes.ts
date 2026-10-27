import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { loginRateLimiter, emailVerificationRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/verify-current', authenticate, AuthController.verifyCurrent);
router.post('/resend-verification', emailVerificationRateLimiter, AuthController.resendVerification);
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/2fa/validate-login', loginRateLimiter, AuthController.validateTwoFactorLogin);
router.post('/2fa/setup', authenticate, AuthController.setupTwoFactor);
router.post('/2fa/enable', authenticate, AuthController.enableTwoFactor);
router.post('/2fa/disable', authenticate, AuthController.disableTwoFactor);
router.post('/2fa/resend-email-otp', emailVerificationRateLimiter, AuthController.resendEmailOtp);
router.post('/forgot-password', passwordResetRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.getMe);
router.post('/elevate-admin', authenticate, AuthController.elevateToAdmin);
router.post('/set-role', authenticate, AuthController.setRole);

export default router;

