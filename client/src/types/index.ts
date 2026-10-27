export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  status: 'active' | 'disabled';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'totp' | 'email';
  failedLoginAttempts?: number;
  lastLoginAt?: string;
  lastAccessedAt?: string;
  lastIp?: string;
  lastAction?: string;
  createdAt?: string;
  documentCount?: number;
}

export interface TwoFactorLoginChallenge {
  requires2FA: true;
  tempToken: string;
  method: 'totp' | 'email';
  maskedEmail: string;
  emailOtpPreview?: string;
  message?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface TwoFactorEnableResponse {
  message: string;
  backupCodes: string[];
  method: 'totp' | 'email';
}

export interface DocumentPermission {
  userId: string | { _id: string; name: string; email: string };
  role: 'owner' | 'editor' | 'viewer';
}

export interface DocumentItem {
  _id: string;
  name: string;
  ownerId: string | { _id: string; name: string; email: string };
  folderId?: string | null;
  currentVersion: number;
  permissions: DocumentPermission[];
  mimeType: string;
  sizeBytes: number;
  isDeleted: boolean;
  isBurnAfterRead?: boolean;
  isBurned?: boolean;
  isStarred?: boolean;
  tags?: string[];
  lockedBy?: string | { _id: string; name: string; email: string } | null;
  lockedAt?: string | null;
  aiMetadata?: {
    summary?: string;
    keyInsights?: string[];
    classification?: 'Confidential' | 'Internal' | 'Public' | 'Restricted' | 'Financial' | 'Legal' | 'Technical';
    riskScore?: number;
    suggestedTags?: string[];
    extractedTextSnippet?: string;
    entities?: { name: string; type: string }[];
    processedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  _id: string;
  documentId: string;
  versionNumber: number;
  fileKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  iv: string;
  authTag: string;
  checksum: string;
  uploadedBy: string | { _id: string; name: string; email: string };
  restoredFromVersion?: number;
  changeSummary?: string;
  createdAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  ownerId: string;
  parentFolderId?: string | null;
  createdAt: string;
}

export interface CommentItem {
  _id: string;
  documentId: string;
  authorId: { _id: string; name: string; email: string; role: string };
  content: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: { _id: string; name: string; email: string; role: string };
  action: string;
  targetType: string;
  targetId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  disabledUsers: number;
  totalDocs: number;
  totalVersions: number;
  totalStorageBytes: number;
  failedLoginCount: number;
}

export interface DocumentPreviewData {
  content: string;
  isText: boolean;
  mimeType: string;
  originalName: string;
  version: number;
  watermark: {
    viewerEmail: string;
    viewerIp: string;
    timestamp: string;
    custodyChecksum: string;
    trackingHash?: string;
    trackingCode?: string;
  };
}

export interface VersionDiffData {
  version1: { versionNumber: number; originalName: string; lines: string[] };
  version2: { versionNumber: number; originalName: string; lines: string[] };
}

export interface GuestLinkItem {
  id: string;
  token: string;
  expiresAt: string;
  maxViews?: number | null;
  viewCount: number;
  hasPassword?: boolean;
  allowDownload: boolean;
  isExpired?: boolean;
  createdAt?: string;
}

export interface VaultHealthData {
  healthScore: number;
  grade: string;
  cipher: string;
  digestAlgorithm: string;
  totalDocuments: number;
  totalVersions: number;
  burnedDocuments: number;
  totalSizeBytes: number;
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeGuestLinks: number;
  formatDistribution: Array<{ mimeType: string; count: number }>;
  lastAuditTimestamp: string;
}

export interface IntegrityScanResult {
  status: 'ALL_PASS' | 'TAMPER_ALERT';
  totalScanned: number;
  verifiedClean: number;
  corrupted: number;
  durationMs: number;
  scannedAt: string;
  scanDetails: any[];
}

export interface PublicShareInfo {
  documentName: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  hasPassword: boolean;
  allowDownload: boolean;
  expiresAt: string;
  viewsRemaining: number | null;
}
