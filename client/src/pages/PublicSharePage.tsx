import React, { useState, useEffect } from 'react';
import { Shield, Lock, Download, Eye, Clock, AlertTriangle, FileText, CheckCircle2, KeyRound } from 'lucide-react';
import { publicApi } from '../api/public';
import { PublicShareInfo } from '../types';

interface PublicSharePageProps {
  token: string;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({ token }) => {
  const [info, setInfo] = useState<PublicShareInfo | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<any | null>(null);

  const loadInfo = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await publicApi.getShareInfo(token);
      setInfo(data);
      // If no password is required, auto-decrypt immediately
      if (!data.hasPassword) {
        handleAccess('');
      }
    } catch (err: any) {
      setError(err.message || 'This guest share link is invalid, expired, or was revoked.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, [token]);

  const handleAccess = async (pass: string = password) => {
    try {
      setIsDecrypting(true);
      setError('');
      const res = await publicApi.accessShare(token, pass);
      setDecryptedContent(res);
    } catch (err: any) {
      setError(err.message || 'Failed to decrypt document. Please check the password.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownload = async () => {
    if (!info) return;
    try {
      await publicApi.downloadPublicFile(token, password, info.documentName);
    } catch (err: any) {
      setError(err.message || 'Download failed.');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Validating Cryptographic Guest Access Token...
      </div>
    );
  }

  if (error && !info) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="glass-panel" style={{ maxWidth: 460, width: '100%', padding: 40, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={30} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: '#ffffff',
      }}
    >
      {/* Top Banner */}
      <header
        style={{
          padding: '16px 32px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>SecureDoc Guest Portal</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              End-to-End AES-256-GCM Ephemeral Link
            </p>
          </div>
        </div>

        {info && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-indigo" style={{ fontSize: 11 }}>
              <Clock size={12} /> Expires: {new Date(info.expiresAt).toLocaleDateString()}
            </span>
            {info.viewsRemaining !== null && (
              <span className="badge badge-amber" style={{ fontSize: 11 }}>
                Views Remaining: {info.viewsRemaining}
              </span>
            )}
            {info.allowDownload && decryptedContent && (
              <button onClick={handleDownload} className="btn btn-primary btn-sm">
                <Download size={14} /> Download Document
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: decryptedContent ? 'flex-start' : 'center',
        }}
      >
        {/* Password Challenge Card */}
        {info?.hasPassword && !decryptedContent && (
          <div className="glass-panel" style={{ maxWidth: 420, width: '100%', padding: 36, textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <KeyRound size={26} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Password Protected</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              This encrypted document (<strong style={{ color: '#fff' }}>{info.documentName}</strong>) requires an access password.
            </p>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  color: '#ef4444',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAccess();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <input
                type="password"
                className="input-control"
                placeholder="Enter document password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isDecrypting}
                style={{ padding: '10px', width: '100%' }}
              >
                {isDecrypting ? 'Decrypting AES-GCM Payload...' : 'Decrypt & View Document'}
              </button>
            </form>
          </div>
        )}

        {/* Decrypted Document Viewer with Watermark */}
        {decryptedContent && (
          <div style={{ maxWidth: 900, width: '100%', position: 'relative' }}>
            <div className="glass-panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
              {/* Anti-Leak Forensic Watermark Lattice */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(5, 1fr)',
                  opacity: 0.12,
                  zIndex: 10,
                  userSelect: 'none',
                }}
              >
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      transform: 'rotate(-25deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.3,
                    }}
                  >
                    <span>{decryptedContent.watermark.viewerEmail}</span>
                    <span>{decryptedContent.watermark.viewerIp}</span>
                    <span>{new Date(decryptedContent.watermark.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>

              {/* Document Header info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={24} color="#6366f1" />
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{decryptedContent.documentName}</h2>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      MIME: {decryptedContent.mimeType} • Authenticated via AES-256-GCM Tag
                    </span>
                  </div>
                </div>

                <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                  <CheckCircle2 size={12} /> Decrypted in Browser
                </span>
              </div>

              {/* Document Body */}
              {decryptedContent.isText ? (
                <pre
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: 20,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    maxHeight: 600,
                    overflowY: 'auto',
                  }}
                >
                  {decryptedContent.content}
                </pre>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    This binary document has been decrypted in memory.
                  </p>
                  {info?.allowDownload && (
                    <button onClick={handleDownload} className="btn btn-primary">
                      <Download size={16} /> Download {decryptedContent.documentName}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
