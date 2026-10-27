import { Router } from 'express';
import { VaultController } from '../controllers/vault.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Vault security health score & statistics
router.get('/health', authenticate, VaultController.getVaultHealth);

// Live cryptographic tamper and integrity scanner
router.post('/integrity-scan', authenticate, VaultController.runIntegrityScan);

export default router;
