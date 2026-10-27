import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Folder } from '../models/Folder';
import { DocumentModel } from '../models/Document';
import { AuditLog } from '../models/AuditLog';

export class FolderController {
  static async createFolder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, parentFolderId } = req.body;
      const userId = req.user?.userId;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Folder name is required.' });
        return;
      }

      const folder = new Folder({
        name: name.trim(),
        ownerId: new mongoose.Types.ObjectId(userId),
        parentFolderId: parentFolderId ? new mongoose.Types.ObjectId(parentFolderId) : null,
      });

      await folder.save();

      await AuditLog.create({
        userId,
        action: 'FOLDER_CREATE',
        targetType: 'document',
        targetId: folder._id.toString(),
        details: { name: folder.name },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(201).json({ message: 'Folder created.', folder });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  static async listFolders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const folders = await Folder.find({ ownerId: new mongoose.Types.ObjectId(userId) }).sort({ name: 1 });
      res.status(200).json({ folders });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  static async deleteFolder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const folder = await Folder.findOne({ _id: id, ownerId: userId });
      if (!folder) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Folder not found.' });
        return;
      }

      // Unassign documents from this folder
      await DocumentModel.updateMany({ folderId: folder._id }, { $set: { folderId: null } });
      await Folder.deleteOne({ _id: folder._id });

      res.status(200).json({ message: 'Folder deleted.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
