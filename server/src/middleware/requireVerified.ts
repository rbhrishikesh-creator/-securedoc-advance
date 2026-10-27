import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      error: 'EMAIL_VERIFICATION_REQUIRED',
      message: 'Email verification is required before uploading, modifying, or sharing documents.',
    });
    return;
  }

  next();
}
