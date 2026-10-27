import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Smartphone, Mail, KeyRound, Copy, Check, Download, AlertTriangle, X } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TwoFactorSettingsCard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isDisableOpen, setIsDisableOpen] = useState<boolean>(false);
  const [step, setStep] = useState<'method' | 'qr' | 'backup'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email'>('totp');

  // Setup state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  // Disable state
  const [disablePassword, setDisablePassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.setupTwoFactor();
      setQrCodeDataUrl(res.qrCodeDataUrl);
      setSecret(res.secret);
      setVerificationCode('');
      setStep(selectedMethod === 'totp' ? 'qr' : 'qr');
      setIsSetupOpen(true);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Setup Failed', message: err.message || 'Could not initialize 2FA setup.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEnable = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter the complete 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.enableTwoFactor({
        code: verificationCode,
        secret,
        method: selectedMethod,
      });

      setBackupCodes(res.backupCodes || []);
      setStep('backup');
      await refreshUser();
      showToast({
        type: 'success',
        title: '2-Step Verification Enabled',
        message: 'Your account is now guarded by multi-factor authentication.',
      });
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check your app and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (!disablePassword) {
      setError('Password is required to disable 2-Step Verification.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authApi.disableTwoFactor(disablePassword);
      setIsDisableOpen(false);
      setDisablePassword('');
      await refreshUser();
      showToast({
        type: 'info',
        title: '2FA Disabled',
        message: '2-Step Verification has been deactivated on your account.',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA. Verify your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const content = `SECUREDOC ADVANCED - 2-STEP VERIFICATION RECOVERY CODES\nGenerated: ${new Date().toISOString()}\nAccount: ${user?.email}\n\nKeep these single-use recovery codes in a secure vault:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nEach code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securedoc-backup-recovery-codes-${user?.email || 'user'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: user?.twoFactorEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              color: user?.twoFactorEnabled ? '#10b981' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {user?.twoFactorEnabled ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>2-Step Verification (2FA)</h3>
              {user?.twoFactorEnabled ? (
                <span className="badge badge-emerald">Enabled</span>
              ) : (
                <span className="badge badge-amber">Recommended</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 520, lineHeight: 1.5 }}>
              Protect your zero-plaintext document vault against unauthorized access. Every sign-in on your laptop, desktop, or mobile device will require a 6-digit cryptographic verification code.
            </p>
          </div>
        </div>

        <div>
          {user?.twoFactorEnabled ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setError('');
                setIsDisableOpen(true);
              }}
              style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              Disable 2-Step Verification
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSetup}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Smartphone size={16} />
              <span>Enable 2-Step Verification</span>
            </button>
          )}
        </div>
      </div>

      {/* Setup 2FA Modal */}
      {isSetupOpen && (
        <div className="modal-overlay" onClick={() => setIsSetupOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500, padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <h3 style={{ fontSize: 18, margin: 0 }}>Set Up 2-Step Verification</h3>
              </div>
              <button
                onClick={() => setIsSetupOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f43f5e',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {step === 'qr' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  1. Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, <strong>Authy</strong>, or your mobile camera:
                </p>

                {qrCodeDataUrl && (
                  <div
                    style={{
                      background: 'white',
                      padding: 16,
                      borderRadius: 'var(--radius-lg)',
                      display: 'inline-block',
                      margin: '0 auto 16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    <img
                      src={qrCodeDataUrl}
                      alt="2FA QR Code"
                      style={{ width: 200, height: 200, display: 'block', margin: '0 auto' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Or enter manual secret key:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      readOnly
                      value={secret}
                      className="input-control"
                      style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copyToClipboard(secret, 'secret')}
                      style={{ padding: '0 14px' }}
                    >
                      {copiedSecret ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    2. Enter 6-Digit Code from App to Confirm:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className="input-control"
                    style={{
                      textAlign: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: 6,
                      padding: '12px',
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsSetupOpen(false)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmEnable}
                    disabled={isLoading || verificationCode.length < 6}
                    style={{ flex: 2, justifyContent: 'center' }}
                  >
                    {isLoading ? 'Verifying...' : 'Activate 2-Step Verification'}
                  </button>
                </div>
              </div>
            )}

            {step === 'backup' && (
              <div>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginBottom: 18,
                  }}
                >
                  <h4 style={{ color: '#10b981', margin: '0 0 4px', fontSize: 15 }}>
                    ✓ 2-Step Verification Activated!
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    Save these 8 recovery codes in a safe place. If you ever lose access to your authenticator app, you can use these single-use codes to regain access to your vault.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    background: 'var(--bg-secondary)',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginBottom: 20,
                  }}
                >
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        letterSpacing: 1,
                      }}
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                    style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 13 }}
                  >
                    {copiedBackup ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{copiedBackup ? 'Copied All!' : 'Copy All Codes'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={downloadBackupCodes}
                    style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 13 }}
                  >
                    <Download size={16} />
                    <span>Download (.txt)</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsSetupOpen(false)}
                  style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                >
                  I Have Saved My Recovery Codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {isDisableOpen && (
        <div className="modal-overlay" onClick={() => setIsDisableOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440, padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f43f5e' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)' }}>Disable 2-Step Verification</h3>
              </div>
              <button
                onClick={() => setIsDisableOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
              Disabling 2-Step Verification removes multi-factor protection. Please confirm your current password to proceed:
            </p>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f43f5e',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Account Password:
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.value);
                  setError('');
                }}
                className="input-control"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDisableOpen(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDisable}
                disabled={isLoading || !disablePassword}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: '#f43f5e',
                  color: 'white',
                  border: 'none',
                }}
              >
                {isLoading ? 'Verifying...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
