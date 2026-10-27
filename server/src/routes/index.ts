import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import folderRoutes from './folder.routes';
import shareRoutes from './share.routes';
import commentRoutes from './comment.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import vaultRoutes from './vault.routes';
import aiRoutes from './ai.routes';

const router = Router();

import path from 'path';

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SecureDoc Advanced REST API',
  });
});

router.get('/report/pdf', (req, res) => {
  const file = path.resolve(__dirname, '../../../SecureDoc_Project_Report.pdf');
  res.download(file, 'SecureDoc_Project_Report.pdf');
});

router.get('/report/docx', (req, res) => {
  const file = path.resolve(__dirname, '../../../SecureDoc_Project_Report.docx');
  res.download(file, 'SecureDoc_Project_Report.docx');
});

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/folders', folderRoutes);
router.use('/documents', shareRoutes);
router.use('/documents', commentRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/vault', vaultRoutes);
router.use('/ai', aiRoutes);

export default router;
