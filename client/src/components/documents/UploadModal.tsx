import React, { useState, useRef } from 'react';
import { UploadCloud, File, Lock, CheckCircle2, AlertCircle, Flame } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../api/documents';
import { Folder } from '../../types';
import { useToast } from '../../context/ToastContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: Folder[];
  activeFolderId: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  folders,
  activeFolderId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [folderId, setFolderId] = useState<string>(activeFolderId || '');
  const [isBurnAfterRead, setIsBurnAfterRead] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!docName) {
        setDocName(selected.name);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!docName) {
        setDocName(dropped.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', docName || file.name);
      if (isBurnAfterRead) {
        formData.append('isBurnAfterRead', 'true');
      }
      if (folderId && folderId !== 'root') {
        formData.append('folderId', folderId);
      }

      await documentsApi.upload(formData);

      showToast({
        type: 'success',
        title: isBurnAfterRead ? '🔥 Ephemeral File Vaulted' : 'AES-256-GCM Vaulted',
        message: `"${docName || file.name}" was encrypted and safely stored.`,
      });

      onSuccess();
      onClose();
      setFile(null);
      setDocName('');
      setIsBurnAfterRead(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Error encrypting and uploading document.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Document Upload">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: file ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-tertiary)',
            borderColor: file ? 'var(--primary)' : 'var(--border-color)',
            transition: 'var(--transition)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <File size={24} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB • Ready for AES-256-GCM Envelope Encryption
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={24} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Click to browse</span> or drag and drop files
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                PDF, DOCX, TXT, MD, CSV, PNG, JPG (up to 30 MB)
              </div>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Document Display Name</label>
          <input
            type="text"
            className="input-control"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Q4 Financial Audit Report"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Destination Folder</label>
          <select
            className="input-control"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            <option value="">Root Vault (No folder)</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unique Feature: Ephemeral Self-Destruct (Burn-after-Read) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: isBurnAfterRead ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-tertiary)',
            border: `1px solid ${isBurnAfterRead ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-color)'}`,
            transition: 'var(--transition)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={18} color={isBurnAfterRead ? '#f43f5e' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isBurnAfterRead ? '#f43f5e' : 'var(--text-primary)' }}>
                Ephemeral Self-Destruct (Burn-on-Read)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Permanently shred file from disk & vault after first download
              </div>
            </div>
          </div>

          <input
            type="checkbox"
            checked={isBurnAfterRead}
            onChange={(e) => setIsBurnAfterRead(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#f43f5e' }}
          />
        </div>

        {/* Cryptographic assurance badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <Lock size={16} color="#10b981" />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Plaintext encrypted with unique 12-byte IV and 16-byte GCM authentication tag before hitting disk storage.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Lock size={16} /> Encrypting & Uploading...
              </>
            ) : (
              'Encrypt & Save to Vault'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
