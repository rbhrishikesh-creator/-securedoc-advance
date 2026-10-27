import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { DocumentModel } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { AuditLog } from '../models/AuditLog';

export class AdminController {
  /**
   * System-wide platform statistics
   */
  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [totalUsers, verifiedUsers, disabledUsers, totalDocs, totalVersions, storageAgg] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ status: 'disabled' }),
        DocumentModel.countDocuments({ isDeleted: false }),
        DocumentVersion.countDocuments(),
        DocumentVersion.aggregate([
          {
            $group: {
              _id: null,
              totalBytes: { $sum: '$sizeBytes' },
            },
          },
        ]),
      ]);

      const totalStorageBytes = storageAgg[0]?.totalBytes || 0;

      // Failed login count in audit logs
      const failedLoginCount = await AuditLog.countDocuments({ action: 'LOGIN_FAILED' });

      res.status(200).json({
        stats: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          disabledUsers,
          totalDocs,
          totalVersions,
          totalStorageBytes,
          failedLoginCount,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * List all registered users with access metrics and status
   */
  static async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });

      // Attach document counts and last access telemetry per user
      const usersWithMetrics = await Promise.all(
        users.map(async (u) => {
          const [docCount, lastLog] = await Promise.all([
            DocumentModel.countDocuments({ ownerId: u._id, isDeleted: false }),
            AuditLog.findOne({ userId: u._id }).sort({ createdAt: -1 }),
          ]);

          return {
            ...u.toObject(),
            documentCount: docCount,
            lastAccessedAt: lastLog?.createdAt || u.lastLoginAt || u.createdAt,
            lastIp: lastLog?.ipAddress || '127.0.0.1',
            lastAction: lastLog?.action || 'ACCOUNT_CREATED',
          };
        })
      );

      res.status(200).json({ users: usersWithMetrics });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Enable or disable a user account
   */
  static async toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = req.body; // 'active' | 'disabled'

      if (!['active', 'disabled'].includes(status)) {
        res.status(400).json({ error: 'INVALID_STATUS', message: 'Status must be active or disabled.' });
        return;
      }

      if (req.user?.userId === userId && status === 'disabled') {
        res.status(400).json({ error: 'FORBIDDEN', message: 'Administrators cannot disable their own account.' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
        return;
      }

      user.status = status;
      await user.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: status === 'disabled' ? 'USER_DISABLED' : 'USER_ENABLED',
        targetType: 'user',
        targetId: user._id.toString(),
        details: { targetEmail: user.email, newStatus: status },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({ message: `User status changed to ${status}.`, user });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Change a user's role (admin <-> user)
   */
  static async changeUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body; // 'admin' | 'user'

      if (!['admin', 'user'].includes(role)) {
        res.status(400).json({ error: 'INVALID_ROLE', message: 'Role must be admin or user.' });
        return;
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
        return;
      }

      if (targetUser.email === 'rbhrishikesh@gmail.com' && role === 'user') {
        res.status(400).json({ error: 'FORBIDDEN', message: 'Master Administrator rbhrishikesh@gmail.com cannot be demoted.' });
        return;
      }

      targetUser.role = role;
      await targetUser.save();

      await AuditLog.create({
        userId: req.user?.userId,
        action: role === 'admin' ? 'USER_PROMOTED_ADMIN' : 'USER_DEMOTED_VIEWER',
        targetType: 'user',
        targetId: targetUser._id.toString(),
        details: { targetEmail: targetUser.email, newRole: role },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(200).json({ message: `User role updated to ${role}.`, user: targetUser });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Retrieve security audit events
   */
  static async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { action, limit = 50, page = 1 } = req.query;
      const query: any = {};

      if (action) {
        query.action = action;
      }

      const pageSize = parseInt(limit as string, 10);
      const pageNum = parseInt(page as string, 10);
      const skip = (pageNum - 1) * pageSize;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('userId', 'name email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize),
        AuditLog.countDocuments(query),
      ]);

      res.status(200).json({
        logs,
        pagination: {
          total,
          page: pageNum,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  /**
   * Forensic Watermark Trace & Attribution Engine
   * Takes a forensic tracking code or checksum found on a leaked document/photo
   * and traces it to the exact viewer identity, IP address, timestamp, and document version.
   */
  static async traceForensicWatermark(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'QUERY_REQUIRED', message: 'Tracking code, hash, or checksum is required.' });
        return;
      }

      const cleanQuery = query.trim().replace(/^SD-/, '');

      // Search audit logs by tracking code, tracking hash, or checksum
      const matchingLogs = await AuditLog.find({
        action: 'DOCUMENT_PREVIEW_WATERMARKED',
        $or: [
          { 'details.trackingCode': { $regex: cleanQuery, $options: 'i' } },
          { 'details.trackingHash': { $regex: cleanQuery, $options: 'i' } },
          { 'details.custodyChecksum': { $regex: cleanQuery, $options: 'i' } },
        ],
      })
        .populate('userId', 'name email role status')
        .sort({ createdAt: -1 })
        .limit(10);

      if (matchingLogs.length === 0) {
        res.status(404).json({
          found: false,
          message: 'No forensic preview match found for the supplied watermark tracking code.',
        });
        return;
      }

      res.status(200).json({
        found: true,
        matches: matchingLogs.map((log) => ({
          auditId: log._id,
          timestamp: log.createdAt,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          viewer: log.userId,
          documentId: log.targetId,
          details: log.details,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
