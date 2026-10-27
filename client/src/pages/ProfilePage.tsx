import React, { useState } from 'react';
import { User, Shield, CheckCircle2, ShieldAlert, Key, Lock, Mail, RefreshCw, Laptop, Smartphone, Download, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth';
import { TwoFactorSettingsCard } from '../components/profile/TwoFactorSettingsCard';
import { InstallAppModal } from '../components/common/InstallAppModal';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, setDevVerifyUrl } = useAuth();
  const { showToast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isElevating, setIsElevating] = useState(false);

  if (!user) return null;

  const handleElevateAdmin = async () => {
    try {
      setIsElevating(true);
      await authApi.elevateToAdmin();
      await refreshUser();
      showToast({
        type: 'success',
        title: 'Admin Access Enabled!',
        message: 'Your account has been elevated to Administrator. Telemetry & forensic tools are now active.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Elevation Error',
        message: err.message,
      });
    } finally {
      setIsElevating(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      const res = await authApi.resendVerification(user.email);
      if (res.devVerifyUrl) {
        setDevVerifyUrl(res.devVerifyUrl);
      }
      showToast({
        type: 'success',
        title: 'Verification Link Sent',
        message: 'A fresh single-use verification token was generated (valid 15m).',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rate Limit',
        message: err.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Security & Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Identity custody, access credentials, and cryptographic parameters
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Email Verification</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.isVerified ? (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontWeight: 600, color: '#10b981' }}>Verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={16} color="#f59e0b" />
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>Unverified</span>
                </>
              )}
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Role & Permissions</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                {user.role === 'admin' ? (
                  <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={15} /> System Administrator
                  </span>
                ) : (
                  'Platform Member'
                )}
              </div>
            </div>
            {user.role !== 'admin' && (
              <button
                type="button"
                onClick={handleElevateAdmin}
                disabled={isElevating}
                className="btn btn-sm btn-primary"
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  padding: '5px 10px',
                  width: 'fit-content',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                }}
              >
                {isElevating ? 'Granting...' : '⚡ Enable Admin Access'}
              </button>
            )}
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Account Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.status}</span>
            </div>
          </div>
        </div>

        {!user.isVerified && (
          <div
            style={{
              marginTop: 20,
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#f59e0b' }}>Action Required</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Uploads and sharing are disabled until you verify your email address.
              </div>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Request Verification Token'}
            </button>
          </div>
        )}
      </div>

      {/* 2-Step Verification (2FA) Security Management */}
      <TwoFactorSettingsCard />

      {/* Multi-Platform Applications & Devices */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Laptop size={18} color="var(--primary)" /> Multi-Platform Applications
          </h3>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setIsInstallOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Get Desktop & Mobile App
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          SecureDoc is designed for cross-device cryptographic synchronization. Install native apps on your laptop, desktop, and mobile devices:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Laptop size={18} color="#6366f1" />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Laptop / Desktop</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Standalone window, taskbar pinning, offline vault access (Windows, Mac, Linux).
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Smartphone size={18} color="#06b6d4" />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Mobile (Android & iOS)</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Touch gesture navigation, camera scan, biometric authentication, and haptics.
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Custody Details */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={18} color="var(--primary)" /> Cryptographic Architecture
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          Your files are protected with AES-256-GCM envelope encryption. When a document is stored, a random 12-byte initialization vector and unique ciphertext is created. Persistent storage contains zero plaintext.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Cipher Algorithm</span>
            <span style={{ fontFamily: 'monospace' }}>AES-256-GCM (Galois/Counter Mode)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>IV Strategy</span>
            <span style={{ fontFamily: 'monospace' }}>CSPRNG 96-bit (12 bytes) per version</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tamper Authentication</span>
            <span style={{ fontFamily: 'monospace' }}>128-bit (16-byte) GCM Auth Tag + SHA-256 Digest</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Verification Tokens</span>
            <span style={{ fontFamily: 'monospace' }}>Redis Atomic Single-Use (GETDEL)</span>
          </div>
        </div>
      </div>

      <InstallAppModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
};
