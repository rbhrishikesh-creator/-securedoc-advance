import React, { useState } from 'react';
import { Shield, Lock, History, Users, RefreshCw, Key, ChevronRight, CheckCircle2, ArrowRight, Download, Smartphone, Laptop } from 'lucide-react';
import { InstallAppModal } from '../components/common/InstallAppModal';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: 72,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800 }}>
            SecureDoc <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Advanced</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsInstallOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={15} color="#06b6d4" />
            <span>Get App</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('login')}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('register')}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '80px 24px 60px',
          maxWidth: 1100,
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          className="badge badge-indigo"
          style={{ padding: '6px 14px', fontSize: 13, borderRadius: 9999 }}
        >
          <Shield size={14} /> Zero-Plaintext Document Custody & Real-Time Collaboration
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
          }}
        >
          High-Assurance Document Storage with{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AES-256-GCM
          </span>{' '}
          Envelope Encryption
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: 'var(--text-secondary)',
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          Protect sensitive enterprise documents with unique initialization vectors, 16-byte cryptographic authentication tags, atomic verification tokens, and non-destructive version rollback.
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: 16 }}
            onClick={() => onNavigate('register')}
          >
            Register Secure Account <ChevronRight size={18} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '14px 24px', fontSize: 16 }}
            onClick={() => onNavigate('login')}
          >
            Existing Vault Login
          </button>
          <button
            className="btn btn-secondary"
            style={{
              padding: '14px 20px',
              fontSize: 15,
              borderColor: 'var(--border-color-glow)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={() => setIsInstallOpen(true)}
          >
            <Download size={17} color="#6366f1" />
            <span>Install on Laptop & Mobile</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            width: '100%',
            marginTop: 60,
            textAlign: 'left',
          }}
        >
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Lock size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>AES-256-GCM Encryption</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Zero plaintext touches persistent disk. Every document operation produces unique 12-byte IVs, 16-byte authentication tags, and SHA-256 integrity checksums.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <History size={22} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Immutable Version Lineage</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Never overwrite files blindly. Uploading replacements automatically logs new versions (`v1`, `v2`, `v3`). Restore prior versions non-destructively in one click.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Users size={22} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Granular RBAC & Sharing</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Assign `Viewer`, `Editor`, and `Owner` roles. Enforce cryptographic permission checks on the backend for every download, rename, and version upload.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-color)',
          padding: '24px 32px',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        SecureDoc Advanced • Multi-Platform Web, Desktop & Mobile • AES-256-GCM Vault
      </footer>

      {/* Cross-Platform App Installation Modal */}
      <InstallAppModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
    </div>
  );
};
