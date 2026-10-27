import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  History,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  MessageSquare,
  Eye,
  GitCompare,
  Flame,
  Skull,
  Star,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { documentsApi } from '../../api/documents';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommentsPanel } from './CommentsPanel';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { VersionDiffModal } from './VersionDiffModal';
import { DocumentAiModal } from './DocumentAiModal';

interface DocumentCardProps {
  document: DocumentItem;
  onShare: (doc: DocumentItem) => void;
  onVersionHistory: (doc: DocumentItem) => void;
  onRefresh: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onShare,
  onVersionHistory,
  onRefresh,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(doc.name);
  const [showComments, setShowComments] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();

  const currentUserId = user?.id || (user as any)?._id;
  const isAdmin = user?.role === 'admin';
  const isViewerOnly = !isAdmin;

  const handleToggleStar = async () => {
    try {
      const res = await documentsApi.toggleStar(doc._id);
      showToast({
        type: 'success',
        title: res.isStarred ? '⭐ Starred' : 'Unstarred',
        message: res.isStarred ? `"${doc.name}" marked as favorite.` : `"${doc.name}" removed from favorites.`,
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().replace(/^#/, '');
    const currentTags = doc.tags || [];
    if (currentTags.includes(cleanTag)) {
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }
    try {
      await documentsApi.updateTags(doc._id, [...currentTags, cleanTag]);
      showToast({
        type: 'success',
        title: 'Tag Added',
        message: `Added tag #${cleanTag}.`,
      });
      setNewTagInput('');
      setIsAddingTag(false);
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Tag Failed',
        message: err.message,
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = doc.tags || [];
    try {
      await documentsApi.updateTags(doc._id, currentTags.filter((t) => t !== tagToRemove));
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Remove Tag',
        message: err.message,
      });
    }
  };

  const handleLock = async () => {
    try {
      await documentsApi.lock(doc._id);
      showToast({
        type: 'success',
        title: '🔒 Document Locked',
        message: 'Exclusive checkout activated. Collaborators cannot overwrite until unlocked.',
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lock Failed',
        message: err.message,
      });
    }
  };

  const handleUnlock = async () => {
    try {
      await documentsApi.unlock(doc._id);
      showToast({
        type: 'info',
        title: '🔓 Document Unlocked',
        message: 'Checkout lock released. Concurrent editing restored.',
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Unlock Failed',
        message: err.message,
      });
    }
  };

  const handleDownload = async () => {
    if (doc.isBurned) {
      showToast({
        type: 'error',
        title: 'Document Shredded',
        message: 'This ephemeral document was shredded upon its first read.',
      });
      return;
    }

    try {
      await documentsApi.download(doc._id, undefined, doc.name);
      showToast({
        type: 'success',
        title: doc.isBurnAfterRead ? '🔥 Decrypted & Shredded' : 'Decrypted Successfully',
        message: doc.isBurnAfterRead
          ? 'Burn-on-read executed. File shredded from vault storage.'
          : 'AES-256-GCM verification passed. Download started.',
      });
      if (doc.isBurnAfterRead) {
        onRefresh();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message,
      });
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === doc.name) {
      setIsRenaming(false);
      return;
    }
    try {
      await documentsApi.rename(doc._id, newName.trim());
      showToast({
        type: 'success',
        title: 'Document Renamed',
        message: `Updated name to "${newName.trim()}".`,
      });
      setIsRenaming(false);
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rename Failed',
        message: err.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;
    try {
      await documentsApi.delete(doc._id);
      showToast({
        type: 'info',
        title: 'Document Removed',
        message: 'Moved to soft-deleted archive.',
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const getFormatBadgeColor = (mime: string) => {
    if (mime.includes('pdf')) return '#ef4444';
    if (mime.includes('word') || mime.includes('document')) return '#3b82f6';
    if (mime.includes('text') || mime.includes('markdown')) return '#10b981';
    return '#8b5cf6';
  };

  return (
    <>
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          transition: 'var(--transition)',
          opacity: doc.isBurned ? 0.6 : 1,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                }}
              >
                {doc.isBurned ? (
                  <Skull size={22} color="#f43f5e" />
                ) : (
                  <FileText size={22} color={getFormatBadgeColor(doc.mimeType)} />
                )}
              </div>

              <div>
                <span className="badge badge-emerald" style={{ fontSize: 10, padding: '2px 8px' }}>
                  <Lock size={10} /> AES-256-GCM
                </span>
                <span className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 6 }}>
                  v{doc.currentVersion}
                </span>

                {doc.lockedBy && (
                  <span className="badge badge-amber" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 6 }}>
                    <Lock size={10} /> Locked ({typeof doc.lockedBy === 'object' ? doc.lockedBy.name : 'In Use'})
                  </span>
                )}

                {doc.isBurnAfterRead && !doc.isBurned && (
                  <span className="badge badge-rose" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 6 }}>
                    <Flame size={10} /> Burn-on-Read
                  </span>
                )}

                {doc.isBurned && (
                  <span className="badge badge-rose" style={{ fontSize: 10, padding: '2px 8px', marginLeft: 6 }}>
                    Shredded
                  </span>
                )}

                {doc.aiMetadata?.classification && (
                  <span
                    className="badge"
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      marginLeft: 6,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={() => setIsAiModalOpen(true)}
                    title={`AI Classification: ${doc.aiMetadata.classification} (Risk: ${doc.aiMetadata.riskScore || 0}/100)`}
                  >
                    <Sparkles size={10} /> {doc.aiMetadata.classification}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons: Star + Context menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
              <button
                onClick={handleToggleStar}
                title={doc.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: doc.isStarred ? '#f59e0b' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Star size={18} fill={doc.isStarred ? '#f59e0b' : 'none'} />
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <MoreVertical size={18} />
              </button>

              {isMenuOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 26,
                    zIndex: 20,
                    width: 175,
                    background: 'var(--bg-secondary)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <button
                    onClick={() => {
                      setIsPreviewOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-sm btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    disabled={doc.isBurned}
                  >
                    <Eye size={14} /> Watermarked View
                  </button>

                  <button
                    onClick={() => {
                      setIsDiffOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-sm btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    disabled={doc.isBurned}
                  >
                    <GitCompare size={14} /> Visual Diff
                  </button>

                  <button
                    onClick={() => {
                      setIsAiModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-sm btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%', color: '#818cf8' }}
                    disabled={doc.isBurned}
                  >
                    <Sparkles size={14} /> AI Intelligence & Ask AI
                  </button>

                  {!isViewerOnly && (
                    <>
                      {doc.lockedBy ? (
                        <button
                          onClick={() => {
                            handleUnlock();
                            setIsMenuOpen(false);
                          }}
                          className="btn btn-sm btn-ghost"
                          style={{ justifyContent: 'flex-start', width: '100%', color: '#38bdf8' }}
                        >
                          <Unlock size={14} /> Release Lock
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleLock();
                            setIsMenuOpen(false);
                          }}
                          className="btn btn-sm btn-ghost"
                          style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                          <Lock size={14} /> Lock & Checkout
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsRenaming(true);
                          setIsMenuOpen(false);
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                      >
                        <Edit2 size={14} /> Rename
                      </button>

                      <button
                        onClick={() => {
                          onShare(doc);
                          setIsMenuOpen(false);
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                      >
                        <Share2 size={14} /> Permissions & Guest
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      onVersionHistory(doc);
                      setIsMenuOpen(false);
                    }}
                    className="btn btn-sm btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                  >
                    <History size={14} /> Lineage
                  </button>

                  {!isViewerOnly && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setIsMenuOpen(false);
                      }}
                      className="btn btn-sm btn-danger"
                      style={{ justifyContent: 'flex-start', width: '100%' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title or Rename Form */}
          {isRenaming ? (
            <form onSubmit={handleRename} style={{ marginBottom: 10 }}>
              <input
                type="text"
                className="input-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onBlur={() => setIsRenaming(false)}
                style={{ fontSize: 13, padding: '6px 10px' }}
              />
            </form>
          ) : (
            <h4
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: doc.isBurned ? 'var(--text-muted)' : 'var(--text-primary)',
                marginBottom: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: doc.isBurned ? 'line-through' : 'none',
              }}
              title={doc.name}
            >
              {doc.name}
            </h4>
          )}

          {/* Tags Ribbon */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {doc.tags && doc.tags.map((tag) => (
              <span
                key={tag}
                className="badge"
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                #{tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <form onSubmit={handleAddTag} style={{ display: 'inline-flex' }}>
                <input
                  type="text"
                  placeholder="tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onBlur={() => setIsAddingTag(false)}
                  autoFocus
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 11,
                    color: '#fff',
                    width: 70,
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="Add tag"
              >
                + Tag
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginBottom: 18 }}>
            <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
            <span>•</span>
            <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: 12,
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className={`btn btn-sm ${isViewerOnly ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 10px', fontSize: 12, flexShrink: 0 }}
                title="Open In-Browser Decrypted Viewer with Watermark"
                disabled={doc.isBurned}
              >
                <Eye size={13} /> View
              </button>

              {!isViewerOnly ? (
                <button
                  onClick={handleDownload}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '6px 10px', fontSize: 12, flexShrink: 0 }}
                  title={doc.isBurnAfterRead ? 'Decrypt & Shred from Vault' : 'Decrypt & Download'}
                  disabled={doc.isBurned}
                >
                  <Download size={13} /> {doc.isBurnAfterRead ? 'Burn & Get' : 'Download'}
                </button>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="View-only access: download option removed by owner"
                >
                  <Lock size={11} /> No Download
                </span>
              )}

              <button
                onClick={() => onVersionHistory(doc)}
                className="btn btn-sm btn-secondary"
                style={{ padding: '6px 10px', fontSize: 12, flexShrink: 0 }}
                title="Inspect Version History"
              >
                <History size={13} /> Lineage
              </button>

              {!isViewerOnly && (
                <button
                  onClick={() => onShare(doc)}
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12, flexShrink: 0 }}
                  title="Share Document & Manage Permissions"
                  disabled={doc.isBurned}
                >
                  <Share2 size={13} /> Share
                </button>
              )}
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`btn btn-sm ${showComments ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 9px', flexShrink: 0 }}
              title="Real-time Comments"
            >
              <MessageSquare size={14} />
            </button>
          </div>

          {showComments && (
            <div style={{ marginTop: 14 }}>
              <CommentsPanel document={doc} />
            </div>
          )}
        </div>
      </div>

      {/* In-Browser Decrypted Viewer Modal with Anti-Leak Watermark */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={doc}
      />

      {/* Visual Line Diff Modal */}
      <VersionDiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        document={doc}
      />

      {/* AI Document Intelligence & Ask AI Modal */}
      {isAiModalOpen && (
        <DocumentAiModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          document={doc}
          onTagsUpdated={onRefresh}
        />
      )}
    </>
  );
};
