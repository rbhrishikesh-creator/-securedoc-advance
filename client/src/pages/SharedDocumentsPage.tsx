import React, { useState, useEffect } from 'react';
import { Share2, Lock, FileText, Download, History, Eye, Edit3 } from 'lucide-react';
import { DocumentItem } from '../types';
import { documentsApi } from '../api/documents';
import { VersionHistoryModal } from '../components/documents/VersionHistoryModal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const SharedDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyDoc, setHistoryDoc] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadShared = async () => {
    try {
      setIsLoading(true);
      const res = await documentsApi.list({ sharedOnly: true });
      setDocuments(res.documents);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Loading Shared Documents',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShared();
  }, []);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await documentsApi.download(doc._id, undefined, doc.name);
      showToast({
        type: 'success',
        title: 'Decrypted Successfully',
        message: 'Decryption verified through AES-256-GCM authentication tag.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message,
      });
    }
  };

  const getUserRole = (doc: DocumentItem): string => {
    if (!user) return 'viewer';
    const currentUserId = user.id || user._id;
    const perm = doc.permissions.find(
      (p) => (typeof p.userId === 'object' ? p.userId._id : p.userId) === currentUserId
    );
    return perm ? perm.role.toUpperCase() : 'VIEWER';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Shared Documents</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Documents shared with your cryptographic identity by team members
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving shared authorization credentials...
        </div>
      ) : documents.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: 60,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={26} color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>No Documents Shared With You Yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440 }}>
            When another registered user grants you Viewer or Editor permissions, their encrypted documents will appear here.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Document</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Owner</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Your Permission</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Version</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const ownerName = typeof doc.ownerId === 'object' ? doc.ownerId.name : 'Owner';
                const role = getUserRole(doc);

                return (
                  <tr
                    key={doc._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'var(--transition)',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="var(--primary)" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{doc.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {(doc.sizeBytes / 1024).toFixed(1)} KB • AES-256-GCM
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{ownerName}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${role === 'EDITOR' ? 'badge-indigo' : 'badge-emerald'}`}>
                        {role === 'EDITOR' ? <Edit3 size={11} /> : <Eye size={11} />} {role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="badge badge-indigo">v{doc.currentVersion}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="btn btn-sm btn-primary"
                          title="Secure Watermarked View"
                        >
                          <Eye size={14} /> View
                        </button>

                        {user?.role === 'admin' ? (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="btn btn-sm btn-secondary"
                            title="Decrypt and Download"
                          >
                            <Download size={14} /> Download
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                            title="Download restricted to Administrators"
                          >
                            <Lock size={12} /> View Only (No Download)
                          </span>
                        )}

                        <button
                          onClick={() => setHistoryDoc(doc)}
                          className="btn btn-sm btn-secondary"
                          title="Version Lineage"
                        >
                          <History size={14} /> Lineage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VersionHistoryModal
        isOpen={!!historyDoc}
        onClose={() => setHistoryDoc(null)}
        document={historyDoc}
        onUpdate={loadShared}
      />

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
};
