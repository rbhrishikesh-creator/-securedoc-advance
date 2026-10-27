import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FolderPlus,
  Search,
  Filter,
  Folder as FolderIcon,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  FolderOpen,
  Star,
  Tag as TagIcon,
  Eye,
  Zap,
} from 'lucide-react';
import { DocumentItem, Folder } from '../types';
import { documentsApi } from '../api/documents';
import { foldersApi } from '../api/folders';
import { authApi } from '../api/auth';
import { DocumentCard } from '../components/documents/DocumentCard';
import { UploadModal } from '../components/documents/UploadModal';
import { ShareModal } from '../components/documents/ShareModal';
import { VersionHistoryModal } from '../components/documents/VersionHistoryModal';
import { SecurityHealthWidget } from '../components/dashboard/SecurityHealthWidget';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';

export const DashboardPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareDoc, setShareDoc] = useState<DocumentItem | null>(null);
  const [historyDoc, setHistoryDoc] = useState<DocumentItem | null>(null);

  const { user } = useAuth();
  const { showToast } = useToast();
  const { socket } = useSocket();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docsRes, foldersRes] = await Promise.all([
        documentsApi.list({
          folderId: activeFolderId || undefined,
          search: searchQuery || undefined,
          type: typeFilter || undefined,
          isStarred: showStarredOnly ? true : undefined,
          tag: tagFilter || undefined,
        }),
        foldersApi.list(),
      ]);
      setDocuments(docsRes.documents);
      setFolders(foldersRes.folders);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Loading Workspace',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFolderId, typeFilter, showStarredOnly, tagFilter]);

  // Real-time socket event refresh
  useEffect(() => {
    if (socket) {
      const handleActivity = () => {
        loadData();
      };
      socket.on('activity:feed', handleActivity);
      return () => {
        socket.off('activity:feed', handleActivity);
      };
    }
  }, [socket, activeFolderId, typeFilter, showStarredOnly, tagFilter]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await foldersApi.create(newFolderName.trim());
      showToast({
        type: 'success',
        title: 'Folder Created',
        message: `Created folder "${newFolderName.trim()}".`,
      });
      setNewFolderName('');
      setIsNewFolderOpen(false);
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Folder Error',
        message: err.message,
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Vault Workspace</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Encrypted document inventory and collaboration center
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {user?.role === 'admin' ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setIsNewFolderOpen(true)}
                title="Create Folder"
              >
                <FolderPlus size={16} /> New Folder
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIsUploadOpen(true)}
                title="Upload Document"
              >
                <UploadCloud size={16} /> Encrypt & Upload
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Lock size={13} /> View-Only Mode
              </span>
            </div>
          )}
        </div>
      </div>

      {/* View-Only Custody Alert for Non-Admins */}
      {user?.role !== 'admin' && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={18} color="#10b981" />
            <div>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>
                🔒 View-Only Custody Active
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                You can view documents in-browser with dynamic forensic watermarks. File downloads and editing are strictly restricted to Administrators.
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await authApi.setRole('admin');
              window.location.reload();
            }}
            className="btn btn-sm btn-primary"
            style={{ fontSize: 12 }}
          >
            <Zap size={13} /> Switch to Admin (All Access)
          </button>
        </div>
      )}

      {/* Vault Security Health & Tamper Scanner */}
      <SecurityHealthWidget />

      {/* Filters & Folders Ribbon */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input-control"
                placeholder="Search encrypted documents by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 16px' }}>
              Search
            </button>
          </form>

          {/* Type and Tag filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="input-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 130 }}
            >
              <option value="">All Formats</option>
              <option value="pdf">PDF Documents</option>
              <option value="word">Word (DOCX)</option>
              <option value="text">Plaintext / MD</option>
              <option value="image">Images</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
              <TagIcon size={14} color="var(--text-muted)" />
              <input
                type="text"
                className="input-control"
                placeholder="#tag filter..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{ width: 110, padding: '6px 8px', fontSize: 12 }}
              />
            </div>

            <button onClick={loadData} className="btn btn-secondary" title="Refresh vault">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Folders List Pill Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => {
              setActiveFolderId(null);
              setShowStarredOnly(false);
            }}
            className={`btn btn-sm ${activeFolderId === null && !showStarredOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FolderOpen size={14} /> All Vault Files
          </button>

          <button
            onClick={() => {
              setShowStarredOnly(!showStarredOnly);
            }}
            className={`btn btn-sm ${showStarredOnly ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Star
              size={13}
              fill={showStarredOnly ? '#f59e0b' : 'none'}
              color={showStarredOnly ? '#f59e0b' : 'currentColor'}
            />
            Starred
          </button>

          {folders.map((f) => (
            <button
              key={f._id}
              onClick={() => {
                setActiveFolderId(f._id);
                setShowStarredOnly(false);
              }}
              className={`btn btn-sm ${activeFolderId === f._id ? 'btn-primary' : 'btn-secondary'}`}
            >
              <FolderIcon size={14} /> {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          Reading zero-plaintext vault index...
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
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={26} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>No Documents in this Vault View</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440 }}>
            Upload sensitive contracts, engineering specs, or internal reports to experience hardware-accelerated AES-256-GCM encryption.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setIsUploadOpen(true)}
            disabled={user ? !user.isVerified : true}
          >
            <UploadCloud size={16} /> Upload Initial Document
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onShare={(d) => setShareDoc(d)}
              onVersionHistory={(d) => setHistoryDoc(d)}
              onRefresh={loadData}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadData}
        folders={folders}
        activeFolderId={activeFolderId}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareDoc}
        onClose={() => setShareDoc(null)}
        document={shareDoc}
        onUpdate={loadData}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={!!historyDoc}
        onClose={() => setHistoryDoc(null)}
        document={historyDoc}
        onUpdate={loadData}
      />

      {/* New Folder Modal */}
      <Modal isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} title="Create New Folder">
        <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Folder Name</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Legal Contracts, Finance 2026"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewFolderOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!newFolderName.trim()}>
              Create Folder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
