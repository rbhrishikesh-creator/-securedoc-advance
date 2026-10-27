import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All AI intelligence routes require authentication
router.use(authenticate);

router.post('/analyze/:id', AiController.analyzeDocument);
router.post('/ask/:id', AiController.askDocumentAi);
router.get('/summary/:id', AiController.getSummary);

export default router;
