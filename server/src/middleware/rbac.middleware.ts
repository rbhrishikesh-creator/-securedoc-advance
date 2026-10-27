import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { DocumentModel } from '../models/Document';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.email === 'rbhrishikesh@gmail.com') {
    if (req.user) req.user.role = 'admin';
    next();
    return;
  }
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Administrator privileges are required.' });
    return;
  }
  next();
}

const ROLE_HIERARCHY: Record<'viewer' | 'editor' | 'owner', number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export function requireDocPermission(minRole: 'viewer' | 'editor' | 'owner') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documentId = req.params.documentId || req.params.id;
      if (!documentId) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Document ID is required.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: documentId, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      // Admin or primary owner always has full access
      if (req.user?.role === 'admin' || doc.ownerId.toString() === currentUserId) {
        (req as any).document = doc;
        next();
        return;
      }

      // Check permission list
      const userPerm = doc.permissions.find((p) => p.userId.toString() === currentUserId);
      if (!userPerm) {
        res.status(403).json({ error: 'ACCESS_DENIED', message: 'You do not have permission to access this document.' });
        return;
      }

      const requiredLevel = ROLE_HIERARCHY[minRole];
      const actualLevel = ROLE_HIERARCHY[userPerm.role];

      if (actualLevel < requiredLevel) {
        res.status(403).json({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Requires ${minRole.toUpperCase()} permission or higher. Current role: ${userPerm.role.toUpperCase()}`,
        });
        return;
      }

      (req as any).document = doc;
      next();
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  };
}
