import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireVerified } from '../middleware/requireVerified';
import { requireDocPermission, requireAdmin } from '../middleware/rbac.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// List documents (authenticated users can view documents in their vault/shared)
router.get('/', authenticate, DocumentController.listDocuments);

// Upload initial document (only Admin can upload/add documents)
router.post(
  '/',
  authenticate,
  requireVerified,
  requireAdmin,
  uploadMiddleware.single('file'),
  DocumentController.uploadDocument
);

// In-browser Zero-Plaintext Preview with Anti-Leak Watermark (viewers & admins can see document)
router.get('/:id/preview', authenticate, requireDocPermission('viewer'), DocumentController.previewDocument);

// Version Diff Engine (viewers & admins can compare lines)
router.get('/:id/diff', authenticate, requireDocPermission('viewer'), DocumentController.diffVersions);

// Get details
router.get('/:id', authenticate, requireDocPermission('viewer'), DocumentController.getDocumentDetails);

// Decrypted download (STRICTLY ONLY ADMIN can download)
router.get('/:id/download', authenticate, requireAdmin, DocumentController.downloadDocument);

// Rename document (STRICTLY ONLY ADMIN can rename/edit)
router.patch('/:id/rename', authenticate, requireVerified, requireAdmin, DocumentController.renameDocument);

// Upload new version (STRICTLY ONLY ADMIN can upload new version)
router.post(
  '/:id/versions',
  authenticate,
  requireVerified,
  requireAdmin,
  uploadMiddleware.single('file'),
  DocumentController.uploadNewVersion
);

// Restore earlier version non-destructively (STRICTLY ONLY ADMIN can restore)
router.post(
  '/:id/restore-version',
  authenticate,
  requireVerified,
  requireAdmin,
  DocumentController.restoreVersion
);

// Starred favorites toggle (viewers & admins can star)
router.patch('/:id/star', authenticate, requireDocPermission('viewer'), DocumentController.toggleStar);

// Update tags (STRICTLY ONLY ADMIN can edit tags)
router.patch('/:id/tags', authenticate, requireVerified, requireAdmin, DocumentController.updateTags);

// Lock document for exclusive editing (STRICTLY ONLY ADMIN can lock)
router.post('/:id/lock', authenticate, requireVerified, requireAdmin, DocumentController.lockDocument);

// Unlock document (STRICTLY ONLY ADMIN can unlock)
router.post('/:id/unlock', authenticate, requireVerified, requireAdmin, DocumentController.unlockDocument);

// Guest share links (STRICTLY ONLY ADMIN can manage guest links)
router.post('/:id/guest-links', authenticate, requireVerified, requireAdmin, DocumentController.createGuestLink);
router.get('/:id/guest-links', authenticate, requireDocPermission('viewer'), DocumentController.getGuestLinks);
router.delete('/:id/guest-links/:linkId', authenticate, requireVerified, requireAdmin, DocumentController.revokeGuestLink);

// Soft delete (STRICTLY ONLY ADMIN can delete)
router.delete('/:id', authenticate, requireVerified, requireAdmin, DocumentController.deleteDocument);

export default router;
