import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel } from '../models/Document';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { SocketService } from '../services/socket.service';

export class ShareController {
  /**
   * Share document with a registered user by email
   */
  static async addShare(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, role = 'viewer' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Target user email is required.' });
        return;
      }

      if (!['viewer', 'editor', 'owner'].includes(role)) {
        res.status(400).json({ error: 'INVALID_ROLE', message: 'Role must be viewer, editor, or owner.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      // Only doc owner or admin can share
      if (req.user?.role !== 'admin' && doc.ownerId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Only the document owner can grant sharing permissions.' });
        return;
      }

      const targetUser = await User.findOne({ email: email.toLowerCase() });
      if (!targetUser) {
        res.status(404).json({ error: 'USER_NOT_FOUND', message: 'No registered account found with that email address.' });
        return;
      }

      if (targetUser._id.toString() === doc.ownerId.toString()) {
        res.status(400).json({ error: 'ALREADY_OWNER', message: 'This user is already the primary owner of the document.' });
        return;
      }

      // Check if permission already exists -> update role; else push
      const existingIndex = doc.permissions.findIndex((p) => p.userId.toString() === targetUser._id.toString());
      if (existingIndex >= 0) {
        doc.permissions[existingIndex].role = role;
      } else {
        doc.permissions.push({
          userId: targetUser._id,
          role,
        });
      }

      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'SHARE_GRANTED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          recipientUserId: targetUser._id.toString(),
          recipientEmail: targetUser.email,
          role,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      // Notify target user via Socket.IO
      SocketService.emitUserNotification(targetUser._id.toString(), {
        type: 'SHARE_GRANTED',
        title: 'New Document Shared With You',
        message: `${req.user?.email} granted you ${role.toUpperCase()} access to "${doc.name}"`,
        documentId: doc._id,
      });

      res.status(200).json({
        message: `Granted ${role} access to ${targetUser.email}.`,
        permissions: doc.permissions,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Revoke document access for a user
   */
  static async revokeShare(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      if (req.user?.role !== 'admin' && doc.ownerId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Only the document owner can revoke access.' });
        return;
      }

      doc.permissions = doc.permissions.filter((p) => p.userId.toString() !== userId);
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'SHARE_REVOKED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: { revokedUserId: userId },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({ message: 'Access revoked successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
