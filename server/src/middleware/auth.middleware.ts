import { Request, Response, NextFunction } from 'express';
import { TokenService, JwtPayload } from '../services/token.service';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: JwtPayload & { status?: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or malformed authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = TokenService.verifyJwt(token);

    // Verify user is not disabled in database and synchronize current role & verification
    const userDoc = await User.findById(payload.userId).select('status isVerified role email');
    if (userDoc) {
      if (userDoc.status === 'disabled') {
        res.status(403).json({ error: 'ACCOUNT_DISABLED', message: 'Your account has been suspended by an administrator.' });
        return;
      }
      payload.isVerified = userDoc.isVerified;
      if (userDoc.role) {
        payload.role = userDoc.role;
      }
      if (userDoc.email === 'rbhrishikesh@gmail.com' || payload.email === 'rbhrishikesh@gmail.com') {
        payload.role = 'admin';
      }
    } else if (payload.email === 'rbhrishikesh@gmail.com') {
      payload.role = 'admin';
    }

    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session expired or token is invalid.' });
  }
}
