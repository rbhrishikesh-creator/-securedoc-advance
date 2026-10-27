import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

// All routes require authentication AND administrative role
router.use(authenticate, requireAdmin);

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.listUsers);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);
router.patch('/users/:userId/role', AdminController.changeUserRole);
router.get('/audit-logs', AdminController.getAuditLogs);
router.post('/forensic-trace', AdminController.traceForensicWatermark);

export default router;
