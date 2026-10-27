import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securedoc_advanced',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'securedoc_super_secure_jwt_secret_key_2026_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // AES-256-GCM Master Key (32 bytes = 64 hex characters)
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  
  // Vault Storage Directory
  vaultStorageDir: process.env.VAULT_STORAGE_DIR || path.resolve(__dirname, '../../storage/vault'),
  
  // Nodemailer / SMTP
  smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'SecureDoc Advanced <security@securedoc.internal>',

  // Gemini AI Intelligence
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
