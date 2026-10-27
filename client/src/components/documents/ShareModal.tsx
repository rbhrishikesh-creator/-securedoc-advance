import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Eye, Edit3, Crown, Link, Copy, Check, Clock, Key, Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../api/documents';
import { DocumentItem, GuestLinkItem } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onUpdate: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'guest'>('internal');

  // Internal collaborator state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'owner'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest link state
  const [guestLinks, setGuestLinks] = useState<GuestLinkItem[]>([]);
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [guestPassword, setGuestPassword] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadGuestLinks = async () => {
    if (!document) return;
    try {
      const res = await documentsApi.getGuestLinks(document._id);
      setGuestLinks(res.links as any);
    } catch {
      // Quiet fail
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      loadGuestLinks();
    }
  }, [isOpen, document]);

  if (!document) return null;

  const handleShareInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      await documentsApi.share(document._id, email.trim(), role);
      showToast({
        type: 'success',
        title: 'Access Granted',
        message: `Granted ${role.toUpperCase()} permissions to ${email}.`,
      });
      setEmail('');
      onUpdate();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Share Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInternal = async (userId: string) => {
    try {
      await documentsApi.revokeShare(document._id, userId);
      showToast({
        type: 'info',
        title: 'Access Revoked',
        message: 'Collaborator permission revoked.',
      });
      onUpdate();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Revoke Failed',
        message: err.message,
      });
    }
  };

  const handleCreateGuestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingLink(true);
      const res = await documentsApi.createGuestLink(document._id, {
        expiresInHours: parseInt(expiresInHours, 10),
        password: guestPassword.trim() || undefined,
        maxViews: maxViews ? parseInt(maxViews, 10) : undefined,
        allowDownload,
      });

      showToast({
        type: 'success',
        title: 'Guest Link Generated',
        message: 'Cryptographically signed public link is ready to share.',
      });

      setGuestPassword('');
      setMaxViews('');
      await loadGuestLinks();
      onUpdate();

      // Copy automatically
      const fullUrl = `${window.location.origin}/share/${res.link.token}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedToken(res.link.token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Link Creation Failed',
        message: err.message,
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleRevokeGuestLink = async (linkId: string) => {
    try {
      await documentsApi.revokeGuestLink(document._id, linkId);
      showToast({
        type: 'info',
        title: 'Link Revoked',
        message: 'Guest access link is no longer accessible.',
      });
      await loadGuestLinks();
      onUpdate();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Revoke Failed',
        message: err.message,
      });
    }
  };

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    showToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Guest share link copied to clipboard.',
    });
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Access Control: "${document.name}"`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
          <button
            onClick={() => setActiveTab('internal')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'internal' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'internal' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UserPlus size={15} /> Internal Collaborators
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'guest' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'guest' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Link size={15} /> Expiring Guest Links ({guestLinks.length})
          </button>
        </div>

        {/* TAB 1: Internal Collaborators */}
        {activeTab === 'internal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <form onSubmit={handleShareInternal} style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                className="input-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@organization.com"
                style={{ flex: 1 }}
                required
              />
              <select
                className="input-control"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ width: 170 }}
              >
                <option value="viewer">Viewer (View Only, No Download)</option>
                <option value="editor">Editor (Can Edit & Download)</option>
                <option value="owner">Owner (Full Vault Control)</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <UserPlus size={16} /> Grant
              </button>
            </form>

            {role === 'viewer' && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: 12,
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Shield size={14} />
                <span>
                  <strong>View Only:</strong> Collaborator can view decrypted document in-browser with dynamic anti-leak watermark. <strong>File download is strictly disabled.</strong>
                </span>
              </div>
            )}
            {role === 'editor' && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: 12,
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Edit3 size={14} />
                <span>
                  <strong>Editor:</strong> Collaborator can view, download decrypted files, and upload new versions.
                </span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Authorized Vault Collaborators
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {document.permissions.map((perm, idx) => {
                  const u = typeof perm.userId === 'object' ? perm.userId : null;
                  const userIdStr = u ? u._id : (perm.userId as string);
                  const displayName = u ? u.name : 'User ID: ' + userIdStr;
                  const displayEmail = u ? u.email : '';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
                          {displayEmail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{displayEmail}</div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className={`badge ${
                            perm.role === 'owner'
                              ? 'badge-amber'
                              : perm.role === 'editor'
                              ? 'badge-indigo'
                              : 'badge-emerald'
                          }`}
                        >
                          {perm.role === 'owner' && <Crown size={11} />}
                          {perm.role === 'editor' && <Edit3 size={11} />}
                          {perm.role === 'viewer' && <Eye size={11} />}
                          {perm.role.toUpperCase()}
                        </span>

                        {perm.role !== 'owner' && (
                          <button
                            onClick={() => handleRevokeInternal(userIdStr)}
                            className="btn btn-sm btn-danger"
                            title="Revoke Access"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Expiring Guest Links */}
        {activeTab === 'guest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <form
              onSubmit={handleCreateGuestLink}
              style={{
                padding: 16,
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                Generate Ephemeral Guest Link
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="input-label" style={{ fontSize: 11 }}>Expiration</label>
                  <select
                    className="input-control"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                  >
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="168">7 Days (1 Week)</option>
                    <option value="720">30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: 11 }}>Optional Password</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="None (Public link)"
                    value={guestPassword}
                    onChange={(e) => setGuestPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <label className="input-label" style={{ fontSize: 11 }}>View Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="input-control"
                    placeholder="Unlimited"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                    />
                    <span>Allow Decrypted File Download</span>
                  </label>
                  {!allowDownload ? (
                    <div style={{ fontSize: 11, color: '#10b981' }}>
                      🛡️ View-Only with Watermark (Download button removed)
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#f59e0b' }}>
                      ⚠️ Guest can download decrypted file to their device
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreatingLink}
                style={{ marginTop: 4, width: '100%', padding: '10px' }}
              >
                <Link size={15} /> {isCreatingLink ? 'Generating Cryptographic Link...' : 'Create Secure Guest Link'}
              </button>
            </form>

            {/* List of active guest links */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Active Guest Links
              </div>
              {guestLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                  No guest links created for this document yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {guestLinks.map((link) => (
                    <div
                      key={link.id || link.token}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>
                            .../share/{link.token.substring(0, 10)}...
                          </span>
                          {link.hasPassword && (
                            <span className="badge badge-amber" style={{ fontSize: 9, padding: '1px 6px' }}>
                              <Key size={10} /> Password
                            </span>
                          )}
                          <span className="badge badge-indigo" style={{ fontSize: 9, padding: '1px 6px' }}>
                            <Clock size={10} /> Exp: {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Views: {link.viewCount} {link.maxViews ? `/ ${link.maxViews}` : ''} • {link.allowDownload ? 'Download Allowed' : 'View Only'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleCopyLink(link.token)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '6px 10px' }}
                          title="Copy Link"
                        >
                          {copiedToken === link.token ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => handleRevokeGuestLink(link.id)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '6px' }}
                          title="Revoke Link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
