import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Download,
  CheckCircle2,
  X,
  Shield,
  Sparkles,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Apple,
  Terminal,
} from 'lucide-react';
import QRCode from 'qrcode';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'android' | 'ios' | 'other'>('windows');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Determine local network mobile URL
  const mobileUrl = window.location.origin.includes('localhost')
    ? window.location.origin.replace('localhost', '10.11.53.110')
    : window.location.origin;

  useEffect(() => {
    // Detect current client device platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      setActiveTab('mobile');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
      setActiveTab('mobile');
    } else if (/macintosh|mac os x/.test(userAgent)) {
      setPlatform('mac');
      setActiveTab('desktop');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
      setActiveTab('desktop');
    }

    // Check if already in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for browser PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Generate Mobile QR code
    QRCode.toDataURL(mobileUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [mobileUrl]);

  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check global prompt if already captured
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const onReady = () => {
      if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt);
      }
    };
    window.addEventListener('pwa-install-ready', onReady);
    return () => window.removeEventListener('pwa-install-ready', onReady);
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).deferredInstallPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as any).deferredInstallPrompt = null;
          return;
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    }
    // Show visual in-modal guide if browser does not support programmatically triggering prompt
    setShowGuide(true);
  };

  const copyMobileLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          width: '100%',
          padding: '28px',
          border: '1px solid var(--border-color-glow)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Download size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>
                Get SecureDoc App
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Multi-Platform Support • Laptop, Desktop & Mobile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-primary)',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab('desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'desktop' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'desktop' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'var(--transition)',
              boxShadow: activeTab === 'desktop' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Laptop size={17} color={activeTab === 'desktop' ? '#6366f1' : 'currentColor'} />
            <span>Laptop & Desktop</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'mobile' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'mobile' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'var(--transition)',
              boxShadow: activeTab === 'mobile' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Smartphone size={17} color={activeTab === 'mobile' ? '#06b6d4' : 'currentColor'} />
            <span>Mobile (Phone & Tablet)</span>
          </button>
        </div>

        {isInstalled && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <CheckCircle2 size={24} color="#10b981" />
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              <strong>App Mode Active:</strong> You are already running SecureDoc in standalone application mode.
            </div>
          </div>
        )}

        {/* Desktop Tab */}
        {activeTab === 'desktop' && (
          <div>
            <div
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                marginBottom: 16,
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  Option 1: 1-Click Desktop PWA App
                </div>
                <span className="badge badge-indigo">Windows • Mac • Linux</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                Installs SecureDoc directly onto your desktop with its own window, taskbar pinning, offline cryptographic
                vault support, and no browser URL bar.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInstallClick}
                style={{ width: '100%', padding: '12px', fontSize: 14 }}
              >
                <Download size={16} /> Install Desktop Application
              </button>

              {showGuide && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> To install in your browser right now:
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Look at the <strong>far right of your browser's address bar</strong> (where the URL is typed):
                  </p>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>http://localhost:5174/</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>[ 🖥️ ⬇️ Install App ]</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Click that icon to install SecureDoc to your Windows Desktop and Start menu.
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Terminal size={16} color="#6366f1" />
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  Option 2: Native Electron Window
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                To launch the dedicated Electron native client on Windows/Mac/Linux:
              </p>
              <code
                style={{
                  display: 'block',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: '#a5b4fc',
                  fontFamily: 'monospace',
                }}
              >
                cd client && npm run electron:dev
              </code>
            </div>
          </div>
        )}

        {/* Mobile Tab */}
        {activeTab === 'mobile' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr',
                gap: 16,
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                marginBottom: 16,
                border: '1px solid var(--border-color)',
                alignItems: 'center',
              }}
            >
              {/* QR Code Container */}
              <div style={{ textAlign: 'center' }}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan for Mobile App"
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 'var(--radius-md)',
                      background: 'white',
                      padding: 6,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={40} color="var(--text-muted)" />
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Scan with Camera
                </div>
              </div>

              {/* Mobile details */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Open on Phone (Same Wi-Fi)
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Point your smartphone camera at this QR code to launch SecureDoc in mobile mode with touch gestures
                  and bottom navigation.
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--bg-primary)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#06b6d4',
                      fontFamily: 'monospace',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mobileUrl}
                  </span>
                  <button
                    onClick={copyMobileLink}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Android / iOS Specific instructions */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 16px',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Android APK & Native iOS Project (Capacitor Ready):
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>
                  <strong>Android Studio project</strong> is initialized in <code style={{ color: '#06b6d4' }}>client/android/</code>. Run <code style={{ color: '#a5b4fc' }}>npx cap open android</code> to build APK.
                </li>
                <li>
                  <strong>Chrome / Edge on Android:</strong> Tap browser menu (⋮) → <strong>Install app</strong> / <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  <strong>Safari on iPhone/iPad:</strong> Tap Share icon (⎋) → <strong>Add to Home Screen</strong>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Features badges footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: 16,
            marginTop: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Shield size={13} color="#10b981" />
            <span>AES-256-GCM Vault</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Sparkles size={13} color="#06b6d4" />
            <span>Responsive Layout</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Smartphone size={13} color="#a5b4fc" />
            <span>Biometric Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
