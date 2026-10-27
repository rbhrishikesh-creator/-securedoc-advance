import React, { useState } from 'react';
import { Shield, ShieldAlert, LogOut, Sun, Moon, CheckCircle2, AlertTriangle, ExternalLink, Zap, Download, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { InstallAppModal } from '../common/InstallAppModal';

export const Navbar: React.FC = () => {
  const { user, logout, devVerifyUrl, setDevVerifyUrl, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleInstantVerify = async () => {
    try {
      setIsVerifying(true);
      await authApi.verifyCurrent();
      await refreshUser();
      showToast({
        type: 'success',
        title: 'Account Verified!',
        message: 'Your email is now verified. You can now upload, encrypt, and share documents!',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      setIsResending(true);
      const res = await authApi.resendVerification(user.email);
      if (res.devVerifyUrl) {
        setDevVerifyUrl(res.devVerifyUrl);
      }
      showToast({
        type: 'success',
        title: 'Verification Link Dispatched',
        message: 'A fresh 15-minute verification link has been sent.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rate Limit / Error',
        message: err.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSwitchRole = async (targetRole: 'admin' | 'user') => {
    try {
      const res = await authApi.setRole(targetRole);
      if (res.token) {
        localStorage.setItem('securedoc_token', res.token);
      }
      await refreshUser();
      showToast({
        type: 'success',
        title: targetRole === 'admin' ? '⚡ Administrator Mode Active' : '🔒 View-Only Mode Active',
        message: targetRole === 'admin'
          ? 'Full master privileges unlocked: Document download, upload, editing, versioning, and admin telemetry.'
          : 'Switched to View-Only mode: Document viewing with dynamic forensic watermark. Downloads and edits are restricted.',
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Role Switch Failed', message: err.message });
    }
  };

  return (
    <>
      {/* Dev helper verification notification bar */}
      {devVerifyUrl && (
        <div
          style={{
            background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
            color: '#ffffff',
            padding: '8px 24px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
              TOKEN READY
            </span>
            <span>Single-use email verification token available.</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleInstantVerify}
              style={{
                background: '#ffffff',
                color: '#4f46e5',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 4,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Zap size={13} /> Verify Account Now (1-Click)
            </button>
            <button
              onClick={() => {
                setDevVerifyUrl(null);
                refreshUser();
              }}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Unverified account warning banner */}
      {user && !user.isVerified && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            padding: '10px 24px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>
              <strong>Account Unverified:</strong> Document uploads, replacements, and sharing are locked until your email is confirmed.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleInstantVerify}
              disabled={isVerifying}
              style={{ fontSize: 12, padding: '4px 12px', background: '#f59e0b', color: '#000000', fontWeight: 700 }}
            >
              <Zap size={13} /> {isVerifying ? 'Verifying...' : 'Click Here to Verify Account Now'}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleResendVerification}
              disabled={isResending}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {isResending ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      )}

      <header
        style={{
          height: 64,
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/college_logo.png"
            alt="Easwari Engineering College Logo"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'contain',
              background: '#ffffff',
              padding: 2,
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)',
            }}
          />
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
              SecureDoc <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Advanced</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Easwari Engineering College • AES-256-GCM Vault
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setIsInstallOpen(true)}
            className="btn btn-sm btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-color-glow)',
            }}
            title="Install SecureDoc standalone app for Laptop, Desktop, and Mobile"
          >
            <Download size={14} color="var(--primary)" />
            <span>Install App</span>
          </button>

          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.isVerified ? (
                  <span className="badge badge-emerald" title="Verified Account">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="badge badge-amber" title="Unverified Account">
                    <ShieldAlert size={12} /> Unverified
                  </span>
                )}
                {user.role === 'admin' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-indigo" title="Administrator: Full Master Access">
                      ⚡ Admin (All Access)
                    </span>
                    <button
                      onClick={() => handleSwitchRole('user')}
                      className="btn btn-sm btn-ghost"
                      style={{ fontSize: 11, padding: '2px 8px', color: 'var(--text-muted)' }}
                      title="Switch to View-Only mode to test restricted viewer experience"
                    >
                      <Eye size={12} /> Test View-Only
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-emerald" title="View-Only: Document inspection with watermark. Downloads & edits restricted.">
                      <Eye size={12} /> View-Only Mode
                    </span>
                    <button
                      onClick={() => handleSwitchRole('admin')}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 11, padding: '3px 9px' }}
                      title="Enable Administrator Privileges (All Access)"
                    >
                      ⚡ Enable Admin
                    </button>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>

              <button
                onClick={logout}
                className="btn btn-sm btn-secondary"
                title="Sign out"
                style={{ padding: '8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <InstallAppModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </>
  );
};
