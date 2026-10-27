import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ShareLinkModel } from '../models/ShareLink';
import { DocumentModel } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { StorageService } from '../services/storage.service';
import { CryptoService } from '../services/crypto.service';
import { AuditLog } from '../models/AuditLog';

export class ShareLinkController {
  /**
   * Get public metadata for a guest share link
   */
  static async getPublicShareInfo(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const link = await ShareLinkModel.findOne({ token, isRevoked: false });

      if (!link) {
        res.status(404).json({ error: 'LINK_NOT_FOUND', message: 'This guest link is invalid or has been revoked.' });
        return;
      }

      if (new Date() > link.expiresAt) {
        res.status(410).json({ error: 'LINK_EXPIRED', message: 'This guest share link has expired.' });
        return;
      }

      if (link.maxViews && link.viewCount >= link.maxViews) {
        res.status(410).json({ error: 'VIEW_LIMIT_REACHED', message: 'This share link has reached its maximum view limit.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: link.documentId, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'The referenced document is no longer available.' });
        return;
      }

      res.status(200).json({
        documentName: doc.name,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        currentVersion: doc.currentVersion,
        hasPassword: !!link.passwordHash,
        allowDownload: link.allowDownload,
        expiresAt: link.expiresAt,
        viewsRemaining: link.maxViews ? Math.max(0, link.maxViews - link.viewCount) : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Decrypt and view or download document content via guest share link
   */
  static async accessPublicShare(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password, download } = req.body;

      const link = await ShareLinkModel.findOne({ token, isRevoked: false });
      if (!link) {
        res.status(404).json({ error: 'LINK_NOT_FOUND', message: 'Link not found or revoked.' });
        return;
      }

      if (new Date() > link.expiresAt) {
        res.status(410).json({ error: 'LINK_EXPIRED', message: 'This guest share link has expired.' });
        return;
      }

      if (link.maxViews && link.viewCount >= link.maxViews) {
        res.status(410).json({ error: 'VIEW_LIMIT_REACHED', message: 'Maximum view limit reached.' });
        return;
      }

      // Verify password if protected
      if (link.passwordHash) {
        if (!password) {
          res.status(401).json({ error: 'PASSWORD_REQUIRED', message: 'Password is required to access this document.' });
          return;
        }
        const isMatch = await bcrypt.compare(password, link.passwordHash);
        if (!isMatch) {
          res.status(401).json({ error: 'INVALID_PASSWORD', message: 'Incorrect password.' });
          return;
        }
      }

      const doc = await DocumentModel.findOne({ _id: link.documentId, isDeleted: false });
      if (!doc || doc.isBurned) {
        res.status(404).json({ error: 'DOCUMENT_UNAVAILABLE', message: 'Document is no longer available.' });
        return;
      }

      const docVersion = await DocumentVersion.findOne({
        documentId: doc._id,
        versionNumber: doc.currentVersion,
      });

      if (!docVersion) {
        res.status(404).json({ error: 'VERSION_NOT_FOUND' });
        return;
      }

      // Decrypt ciphertext using stored IV and auth tag
      const ciphertext = await StorageService.readEncrypted(docVersion.fileKey);
      const decrypted = CryptoService.decrypt(
        ciphertext,
        docVersion.iv,
        docVersion.authTag,
        docVersion.checksum
      );

      // Increment view count
      link.viewCount += 1;
      await link.save();

      // Log guest access in audit log
      await AuditLog.create({
        action: 'PUBLIC_GUEST_ACCESS',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          token,
          isDownload: !!download,
          viewsCount: link.viewCount,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      if (download) {
        if (!link.allowDownload) {
          res.status(403).json({ error: 'DOWNLOAD_FORBIDDEN', message: 'Downloads are disabled for this link.' });
          return;
        }
        res.setHeader('Content-Type', docVersion.mimeType || 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(docVersion.originalName)}"`
        );
        res.setHeader('Content-Length', decrypted.length);
        res.send(decrypted);
        return;
      }

      const isText =
        docVersion.mimeType.startsWith('text/') ||
        docVersion.mimeType.includes('json') ||
        docVersion.mimeType.includes('markdown') ||
        docVersion.originalName.endsWith('.txt') ||
        docVersion.originalName.endsWith('.md');

      const content = isText ? decrypted.toString('utf-8') : decrypted.toString('base64');

      res.status(200).json({
        content,
        isText,
        mimeType: docVersion.mimeType,
        documentName: doc.name,
        watermark: {
          viewerEmail: 'Guest Access (External Link)',
          viewerIp: req.ip || '127.0.0.1',
          timestamp: new Date().toISOString(),
          custodyChecksum: docVersion.checksum,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
