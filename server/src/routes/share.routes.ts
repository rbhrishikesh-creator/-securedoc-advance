import { Router } from 'express';
import { ShareController } from '../controllers/share.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireVerified } from '../middleware/requireVerified';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.post('/:id/share', authenticate, requireVerified, requireAdmin, ShareController.addShare);
router.delete('/:id/share/:userId', authenticate, requireVerified, requireAdmin, ShareController.revokeShare);

export default router;
