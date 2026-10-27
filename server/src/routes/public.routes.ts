import { Router } from 'express';
import { ShareLinkController } from '../controllers/shareLink.controller';

const router = Router();

// Public guest share link info
router.get('/share/:token', ShareLinkController.getPublicShareInfo);

// Public guest share access/download
router.post('/share/:token/access', ShareLinkController.accessPublicShare);

export default router;
