import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Comment } from '../models/Comment';
import { SocketService } from '../services/socket.service';

export class CommentController {
  static async listComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const comments = await Comment.find({ documentId: new mongoose.Types.ObjectId(id) })
        .populate('authorId', 'name email role')
        .sort({ createdAt: 1 });

      res.status(200).json({ comments });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  static async addComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Comment content cannot be empty.' });
        return;
      }

      const comment = new Comment({
        documentId: new mongoose.Types.ObjectId(id),
        authorId: new mongoose.Types.ObjectId(userId),
        content: content.trim(),
      });

      await comment.save();
      await comment.populate('authorId', 'name email role');

      // Real-time broadcast to all viewers of the document room
      SocketService.emitCommentAdded(id, comment);

      res.status(201).json({ comment });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }

  static async deleteComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user?.userId;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      // Allow author or admin
      if (req.user?.role !== 'admin' && comment.authorId.toString() !== userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'You can only delete your own comments.' });
        return;
      }

      await Comment.deleteOne({ _id: comment._id });
      res.status(200).json({ message: 'Comment removed.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  }
}
