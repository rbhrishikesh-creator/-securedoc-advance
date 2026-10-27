import { Router } from 'express';
import { FolderController } from '../controllers/folder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireVerified } from '../middleware/requireVerified';

const router = Router();

router.get('/', authenticate, FolderController.listFolders);
router.post('/', authenticate, requireVerified, FolderController.createFolder);
router.delete('/:id', authenticate, requireVerified, FolderController.deleteFolder);

export default router;
