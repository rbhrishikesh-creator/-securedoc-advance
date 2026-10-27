import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireDocPermission } from '../middleware/rbac.middleware';

const router = Router();

router.get('/:id/comments', authenticate, requireDocPermission('viewer'), CommentController.listComments);
router.post('/:id/comments', authenticate, requireDocPermission('viewer'), CommentController.addComment);
router.delete('/comments/:commentId', authenticate, CommentController.deleteComment);

export default router;
