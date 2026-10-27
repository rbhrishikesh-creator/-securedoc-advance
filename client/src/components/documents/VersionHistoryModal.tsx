import React, { useState, useEffect } from 'react';
import { History, Download, RotateCcw, UploadCloud, ShieldCheck, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../api/documents';
import { DocumentItem, DocumentVersion } from '../../types';
import { useToast } from '../../context/ToastContext';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onUpdate: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const { showToast } = useToast();

  const loadVersions = async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      const res = await documentsApi.getDetails(document._id);
      setVersions(res.versions);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Loading Lineage',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      loadVersions();
    }
  }, [isOpen, document]);

  if (!document) return null;

  const handleDownloadVersion = async (vNum: number, filename: string) => {
    try {
      await documentsApi.download(document._id, vNum, `v${vNum}_${filename}`);
      showToast({
        type: 'success',
        title: 'Decrypted & Downloaded',
        message: `Version ${vNum} decrypted via AES-256-GCM.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message,
      });
    }
  };

  const handleRestoreVersion = async (targetVersion: number) => {
    if (!window.confirm(`Are you sure you want to restore Version ${targetVersion}? A new version (v${document.currentVersion + 1}) will be published preserving all history.`)) {
      return;
    }

    try {
      await documentsApi.restoreVersion(document._id, targetVersion);
      showToast({
        type: 'success',
        title: 'Non-Destructive Rollback Complete',
        message: `Restored Version ${targetVersion} as new Version ${document.currentVersion + 1}.`,
      });
      loadVersions();
      onUpdate();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rollback Failed',
        message: err.message,
      });
    }
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile) return;

    try {
      setIsUploadingNew(true);
      const formData = new FormData();
      formData.append('file', newVersionFile);
      formData.append('changeSummary', changeSummary || 'Uploaded revised document');

      await documentsApi.uploadNewVersion(document._id, formData);
      showToast({
        type: 'success',
        title: 'Version Published',
        message: `New Version ${document.currentVersion + 1} encrypted and published.`,
      });
      setNewVersionFile(null);
      setChangeSummary('');
      loadVersions();
      onUpdate();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message,
      });
    } finally {
      setIsUploadingNew(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Version Lineage: "${document.name}"`} maxWidth={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Upload replacement version section */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <UploadCloud size={18} color="var(--primary)" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Upload Replacement Version</span>
          </div>

          <form onSubmit={handleUploadNewVersion} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="file"
                className="input-control"
                onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
                required
                style={{ flex: 1 }}
              />
              <input
                type="text"
                className="input-control"
                placeholder="Change summary (e.g. Added section 4)"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!newVersionFile || isUploadingNew}
              >
                {isUploadingNew ? 'Encrypting v' + (document.currentVersion + 1) + '...' : 'Publish New Version'}
              </button>
            </div>
          </form>
        </div>

        {/* Versions Timeline List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Historical Lineage ({versions.length} versions)
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Linear Immutable History
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Decrypting version metadata...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {versions.map((ver) => {
                const isCurrent = ver.versionNumber === document.currentVersion;
                const uploaderName = typeof ver.uploadedBy === 'object' ? ver.uploadedBy?.name : 'User';

                return (
                  <div
                    key={ver._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border-color)'}`,
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: isCurrent ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: isCurrent ? '#ffffff' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        v{ver.versionNumber}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{ver.originalName}</span>
                          {isCurrent && <span className="badge badge-emerald">Active</span>}
                          {ver.restoredFromVersion && (
                            <span className="badge badge-amber">
                              Restored from v{ver.restoredFromVersion}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {(ver.sizeBytes / 1024).toFixed(1)} KB • Uploaded by {uploaderName} on{' '}
                          {new Date(ver.createdAt).toLocaleDateString()} at{' '}
                          {new Date(ver.createdAt).toLocaleTimeString()}
                        </div>
                        {ver.changeSummary && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                            "{ver.changeSummary}"
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
                          SHA-256: {ver.checksum.substring(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleDownloadVersion(ver.versionNumber, ver.originalName)}
                        className="btn btn-sm btn-secondary"
                        title="Decrypted Download"
                      >
                        <Download size={14} /> Download
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => handleRestoreVersion(ver.versionNumber)}
                          className="btn btn-sm btn-outline"
                          title="Restore this version as new active version"
                          style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
