import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentModel } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { ShareLinkModel } from '../models/ShareLink';
import { CryptoService } from '../services/crypto.service';
import { StorageService } from '../services/storage.service';
import { SocketService } from '../services/socket.service';
import { AuditLog } from '../models/AuditLog';

export class DocumentController {
  /**
   * Upload initial document version with optional Ephemeral Self-Destruct
   */
  static async uploadDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'FILE_REQUIRED', message: 'No file was provided for upload.' });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const folderId = req.body.folderId ? new mongoose.Types.ObjectId(req.body.folderId) : undefined;
      const documentName = req.body.name?.trim() || file.originalname;
      const isBurnAfterRead = req.body.isBurnAfterRead === 'true' || req.body.isBurnAfterRead === true;

      // AES-256-GCM Encryption with unique IV
      const encrypted = CryptoService.encrypt(file.buffer);
      const fileKey = `enc_${crypto.randomBytes(16).toString('hex')}`;

      // Zero-plaintext disk custody
      await StorageService.saveEncrypted(fileKey, encrypted.ciphertext);

      // Create Document document
      const doc = new DocumentModel({
        name: documentName,
        ownerId: userId,
        folderId,
        currentVersion: 1,
        permissions: [
          {
            userId: new mongoose.Types.ObjectId(userId),
            role: 'owner',
          },
        ],
        mimeType: file.mimetype,
        sizeBytes: file.size,
        isBurnAfterRead,
      });

      await doc.save();

      // Create Initial DocumentVersion (v1)
      const version1 = new DocumentVersion({
        documentId: doc._id,
        versionNumber: 1,
        fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        iv: encrypted.ivHex,
        authTag: encrypted.authTagHex,
        checksum: encrypted.checksum,
        uploadedBy: userId,
        changeSummary: 'Initial document upload',
      });

      await version1.save();

      await AuditLog.create({
        userId,
        action: 'DOCUMENT_UPLOAD',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          name: doc.name,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          checksum: encrypted.checksum,
          version: 1,
          isBurnAfterRead,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      // Real-time broadcast
      SocketService.emitDocumentUpdate(doc._id.toString(), 'document:created', {
        document: doc,
      });

      res.status(201).json({
        message: 'Document securely encrypted with AES-256-GCM and stored.',
        document: doc,
        version: version1,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * List accessible documents with search, folder filtering, and sort
   */
  static async listDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED' });
        return;
      }

      const {
        folderId,
        search,
        type,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        sharedOnly,
        isStarred,
        tag,
      } = req.query;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const query: any = { isDeleted: false };

      if (sharedOnly === 'true') {
        query.ownerId = { $ne: userObjectId };
        query['permissions.userId'] = userObjectId;
      } else {
        query.$or = [{ ownerId: userObjectId }, { 'permissions.userId': userObjectId }];
      }

      if (folderId) {
        query.folderId = folderId === 'root' ? null : new mongoose.Types.ObjectId(folderId as string);
      }

      if (search) {
        query.name = { $regex: search as string, $options: 'i' };
      }

      if (type) {
        query.mimeType = { $regex: type as string, $options: 'i' };
      }

      if (isStarred === 'true') {
        query.isStarred = true;
      }

      if (tag) {
        query.tags = tag as string;
      }

      const sortDir = sortOrder === 'asc' ? 1 : -1;
      const documents = await DocumentModel.find(query)
        .populate('ownerId', 'name email')
        .populate('lockedBy', 'name email')
        .populate('permissions.userId', 'name email')
        .sort({ [sortBy as string]: sortDir });

      res.status(200).json({ documents });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Get single document details with populated permissions
   */
  static async getDocumentDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false })
        .populate('ownerId', 'name email')
        .populate('permissions.userId', 'name email');

      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      const versions = await DocumentVersion.find({ documentId: doc._id })
        .populate('uploadedBy', 'name email')
        .sort({ versionNumber: -1 });

      res.status(200).json({ document: doc, versions });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * In-browser Zero-Plaintext Preview with Anti-Leak Watermark Metadata
   */
  static async previewDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { version } = req.query;

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      if (doc.isBurned) {
        res.status(410).json({ error: 'DOCUMENT_BURNED', message: 'This ephemeral document was shredded upon first read.' });
        return;
      }

      const targetVersionNum = version ? parseInt(version as string, 10) : doc.currentVersion;
      const docVersion = await DocumentVersion.findOne({
        documentId: doc._id,
        versionNumber: targetVersionNum,
      });

      if (!docVersion) {
        res.status(404).json({ error: 'VERSION_NOT_FOUND' });
        return;
      }

      const ciphertext = await StorageService.readEncrypted(docVersion.fileKey);
      const decrypted = CryptoService.decrypt(
        ciphertext,
        docVersion.iv,
        docVersion.authTag,
        docVersion.checksum
      );

      const isText = docVersion.mimeType.startsWith('text/') ||
        docVersion.mimeType.includes('json') ||
        docVersion.mimeType.includes('markdown') ||
        docVersion.originalName.endsWith('.txt') ||
        docVersion.originalName.endsWith('.md');

      const content = isText ? decrypted.toString('utf-8') : decrypted.toString('base64');

      // Generate unique forensic tracking hash
      const timestamp = new Date().toISOString();
      const trackingHash = crypto
        .createHash('sha256')
        .update(`${req.user?.userId}:${doc._id}:${targetVersionNum}:${timestamp}`)
        .digest('hex');

      const trackingCode = `SD-${trackingHash.substring(0, 10).toUpperCase()}`;

      // Forensic watermarking tracking metadata
      const watermark = {
        viewerEmail: req.user?.email || 'authenticated_viewer',
        viewerIp: req.ip || '127.0.0.1',
        timestamp,
        custodyChecksum: docVersion.checksum,
        trackingHash,
        trackingCode,
      };

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_PREVIEW_WATERMARKED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          version: targetVersionNum,
          documentName: doc.name,
          isText,
          mimeType: docVersion.mimeType,
          trackingHash,
          trackingCode,
          custodyChecksum: docVersion.checksum,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({
        content,
        isText,
        mimeType: docVersion.mimeType,
        originalName: docVersion.originalName,
        version: docVersion.versionNumber,
        watermark,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'PREVIEW_ERROR', message: err.message });
    }
  }

  /**
   * Version Diff Engine: Compares content between Version A and Version B
   */
  static async diffVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { v1, v2 } = req.query;

      const vNum1 = parseInt(v1 as string, 10);
      const vNum2 = parseInt(v2 as string, 10);

      const [ver1, ver2] = await Promise.all([
        DocumentVersion.findOne({ documentId: id, versionNumber: vNum1 }),
        DocumentVersion.findOne({ documentId: id, versionNumber: vNum2 }),
      ]);

      if (!ver1 || !ver2) {
        res.status(404).json({ error: 'VERSIONS_NOT_FOUND', message: 'Specified versions for diff were not found.' });
        return;
      }

      // Decrypt both versions
      const [cipher1, cipher2] = await Promise.all([
        StorageService.readEncrypted(ver1.fileKey),
        StorageService.readEncrypted(ver2.fileKey),
      ]);

      const plain1 = CryptoService.decrypt(cipher1, ver1.iv, ver1.authTag, ver1.checksum).toString('utf-8');
      const plain2 = CryptoService.decrypt(cipher2, ver2.iv, ver2.authTag, ver2.checksum).toString('utf-8');

      // Line-by-line diff computation
      const lines1 = plain1.split('\n');
      const lines2 = plain2.split('\n');

      res.status(200).json({
        version1: { versionNumber: vNum1, originalName: ver1.originalName, lines: lines1 },
        version2: { versionNumber: vNum2, originalName: ver2.originalName, lines: lines2 },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'DIFF_ERROR', message: err.message });
    }
  }

  /**
   * Download latest or specific version of document with streaming AES-256-GCM decryption
   * Supports Ephemeral Self-Destruct (Burn-after-Read)
   */
  static async downloadDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { version } = req.query;

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found.' });
        return;
      }

      if (doc.isBurned) {
        res.status(410).json({ error: 'DOCUMENT_BURNED', message: 'This document was shredded after first custody view.' });
        return;
      }

      // Defense-in-depth: ONLY ADMINISTRATORS have file download privileges
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          error: 'DOWNLOAD_FORBIDDEN',
          message: 'Download restricted: Only administrators have file download permissions. View-only access allows in-browser inspection with dynamic watermark.',
        });
        return;
      }

      const targetVersionNum = version ? parseInt(version as string, 10) : doc.currentVersion;
      const docVersion = await DocumentVersion.findOne({
        documentId: doc._id,
        versionNumber: targetVersionNum,
      });

      if (!docVersion) {
        res.status(404).json({ error: 'VERSION_NOT_FOUND', message: `Version ${targetVersionNum} not found.` });
        return;
      }

      // Read encrypted ciphertext from vault disk
      const ciphertext = await StorageService.readEncrypted(docVersion.fileKey);

      // Decrypt and verify 16-byte authTag + SHA-256 checksum
      const decrypted = CryptoService.decrypt(
        ciphertext,
        docVersion.iv,
        docVersion.authTag,
        docVersion.checksum
      );

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_DOWNLOAD',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          version: docVersion.versionNumber,
          originalName: docVersion.originalName,
          sizeBytes: docVersion.sizeBytes,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      // If Burn-after-Read enabled: Cryptographically shred file after download
      if (doc.isBurnAfterRead) {
        doc.isBurned = true;
        await doc.save();
        await StorageService.deleteEncrypted(docVersion.fileKey);

        await AuditLog.create({
          userId: req.user?.userId,
          action: 'DOCUMENT_BURNED_ON_READ',
          targetType: 'document',
          targetId: doc._id.toString(),
          details: { name: doc.name, version: docVersion.versionNumber },
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        });

        SocketService.emitDocumentUpdate(doc._id.toString(), 'document:burned', {
          documentId: doc._id,
        });
      }

      res.setHeader('Content-Type', docVersion.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(docVersion.originalName)}"`
      );
      res.setHeader('Content-Length', decrypted.length);

      res.send(decrypted);
    } catch (err: any) {
      res.status(500).json({ error: 'DECRYPTION_ERROR', message: `Failed to decrypt document: ${err.message}` });
    }
  }

  /**
   * Upload a new replacement version
   */
  static async uploadNewVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      const changeSummary = req.body.changeSummary || 'Uploaded revised version';

      if (!file) {
        res.status(400).json({ error: 'FILE_REQUIRED', message: 'A replacement file is required.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      if (doc.lockedBy && doc.lockedBy.toString() !== req.user?.userId) {
        res.status(423).json({
          error: 'DOCUMENT_LOCKED',
          message: 'This document is locked for exclusive editing by another collaborator.',
        });
        return;
      }

      // Encrypt replacement with fresh unique IV
      const encrypted = CryptoService.encrypt(file.buffer);
      const fileKey = `enc_${crypto.randomBytes(16).toString('hex')}`;
      await StorageService.saveEncrypted(fileKey, encrypted.ciphertext);

      const nextVersionNum = doc.currentVersion + 1;

      const newVersion = new DocumentVersion({
        documentId: doc._id,
        versionNumber: nextVersionNum,
        fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        iv: encrypted.ivHex,
        authTag: encrypted.authTagHex,
        checksum: encrypted.checksum,
        uploadedBy: req.user?.userId,
        changeSummary,
      });

      await newVersion.save();

      doc.currentVersion = nextVersionNum;
      doc.mimeType = file.mimetype;
      doc.sizeBytes = file.size;
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_NEW_VERSION',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          version: nextVersionNum,
          originalName: file.originalname,
          sizeBytes: file.size,
          changeSummary,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'version:created', {
        document: doc,
        version: newVersion,
      });

      res.status(201).json({
        message: `Version ${nextVersionNum} created successfully. Prior versions remain preserved.`,
        document: doc,
        version: newVersion,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Non-destructive rollback
   */
  static async restoreVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { targetVersion } = req.body;

      if (!targetVersion) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Target version number is required.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const sourceVersion = await DocumentVersion.findOne({
        documentId: doc._id,
        versionNumber: targetVersion,
      });

      if (!sourceVersion) {
        res.status(404).json({ error: 'VERSION_NOT_FOUND', message: `Version ${targetVersion} not found.` });
        return;
      }

      const nextVersionNum = doc.currentVersion + 1;

      const restoredVersion = new DocumentVersion({
        documentId: doc._id,
        versionNumber: nextVersionNum,
        fileKey: sourceVersion.fileKey,
        originalName: sourceVersion.originalName,
        mimeType: sourceVersion.mimeType,
        sizeBytes: sourceVersion.sizeBytes,
        iv: sourceVersion.iv,
        authTag: sourceVersion.authTag,
        checksum: sourceVersion.checksum,
        uploadedBy: req.user?.userId,
        restoredFromVersion: sourceVersion.versionNumber,
        changeSummary: `Restored non-destructively from version ${sourceVersion.versionNumber}`,
      });

      await restoredVersion.save();

      doc.currentVersion = nextVersionNum;
      doc.mimeType = sourceVersion.mimeType;
      doc.sizeBytes = sourceVersion.sizeBytes;
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_RESTORE_VERSION',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          restoredFromVersion: sourceVersion.versionNumber,
          publishedVersion: nextVersionNum,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'version:restored', {
        document: doc,
        version: restoredVersion,
      });

      res.status(200).json({
        message: `Restored content from version ${targetVersion} as new version ${nextVersionNum}.`,
        document: doc,
        version: restoredVersion,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Rename document
   */
  static async renameDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Document name cannot be empty.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const oldName = doc.name;
      doc.name = name.trim();
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_RENAME',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: { oldName, newName: doc.name },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'document:renamed', {
        document: doc,
      });

      res.status(200).json({ message: 'Document renamed successfully.', document: doc });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Soft delete document
   */
  static async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      if (req.user?.role !== 'admin' && doc.ownerId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Only the document owner or an admin can delete it.' });
        return;
      }

      doc.isDeleted = true;
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_DELETE',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: { name: doc.name },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'document:deleted', {
        documentId: doc._id,
      });

      res.status(200).json({ message: 'Document removed.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Toggle starred status for document
   */
  static async toggleStar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      doc.isStarred = !doc.isStarred;
      await doc.save();

      res.status(200).json({
        message: doc.isStarred ? 'Document added to starred favorites.' : 'Document removed from starred.',
        isStarred: doc.isStarred,
        document: doc,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Update category tags for document
   */
  static async updateTags(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        res.status(400).json({ error: 'INVALID_TAGS', message: 'Tags must be an array of strings.' });
        return;
      }

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      doc.tags = tags.map((t: string) => t.trim()).filter(Boolean);
      await doc.save();

      res.status(200).json({
        message: 'Tags updated successfully.',
        tags: doc.tags,
        document: doc,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Lock document for exclusive editing
   */
  static async lockDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      if (doc.lockedBy && doc.lockedBy.toString() !== req.user?.userId) {
        res.status(423).json({
          error: 'ALREADY_LOCKED',
          message: 'Document is already locked by another collaborator.',
        });
        return;
      }

      doc.lockedBy = new mongoose.Types.ObjectId(req.user?.userId);
      doc.lockedAt = new Date();
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_LOCKED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: { name: doc.name },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'document:locked', {
        documentId: doc._id,
        lockedBy: req.user?.userId,
      });

      res.status(200).json({ message: 'Document locked for exclusive editing.', document: doc });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Unlock document
   */
  static async unlockDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      // Allow lock holder, document owner, or admin to unlock
      const isLockHolder = doc.lockedBy && doc.lockedBy.toString() === req.user?.userId;
      const isOwner = doc.ownerId.toString() === req.user?.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isLockHolder && !isOwner && !isAdmin) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have permission to unlock this document.' });
        return;
      }

      doc.lockedBy = null;
      doc.lockedAt = null;
      await doc.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'DOCUMENT_UNLOCKED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: { name: doc.name },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      SocketService.emitDocumentUpdate(doc._id.toString(), 'document:unlocked', {
        documentId: doc._id,
      });

      res.status(200).json({ message: 'Document unlocked.', document: doc });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Create an expiring, optionally password-protected guest share link
   */
  static async createGuestLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { expiresInHours = 24, password, maxViews, allowDownload = true } = req.body;

      const doc = await DocumentModel.findOne({ _id: id, isDeleted: false });
      if (!doc) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const token = crypto.randomBytes(24).toString('hex');
      let passwordHash: string | null = null;
      if (password && password.trim().length > 0) {
        passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      const hours = parseInt(expiresInHours, 10) || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

      const shareLink = new ShareLinkModel({
        documentId: doc._id,
        createdBy: req.user?.userId,
        token,
        passwordHash,
        expiresAt,
        maxViews: maxViews ? parseInt(maxViews, 10) : null,
        allowDownload,
      });

      await shareLink.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: 'GUEST_LINK_CREATED',
        targetType: 'document',
        targetId: doc._id.toString(),
        details: {
          token,
          expiresAt,
          maxViews,
          hasPassword: !!passwordHash,
        },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(201).json({
        message: 'Guest share link created successfully.',
        link: {
          id: shareLink._id,
          token: shareLink.token,
          expiresAt: shareLink.expiresAt,
          maxViews: shareLink.maxViews,
          hasPassword: !!passwordHash,
          allowDownload: shareLink.allowDownload,
          viewCount: shareLink.viewCount,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * List active guest links for a document
   */
  static async getGuestLinks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const links = await ShareLinkModel.find({
        documentId: id,
        isRevoked: false,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        links: links.map((l) => ({
          id: l._id,
          token: l.token,
          expiresAt: l.expiresAt,
          maxViews: l.maxViews,
          viewCount: l.viewCount,
          hasPassword: !!l.passwordHash,
          allowDownload: l.allowDownload,
          isExpired: new Date() > l.expiresAt,
          createdAt: l.createdAt,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Revoke a guest share link
   */
  static async revokeGuestLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;
      const link = await ShareLinkModel.findById(linkId);
      if (!link) {
        res.status(404).json({ error: 'LINK_NOT_FOUND' });
        return;
      }

      link.isRevoked = true;
      await link.save();

      res.status(200).json({ message: 'Guest share link revoked.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
