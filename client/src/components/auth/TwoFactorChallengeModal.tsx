import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Smartphone, Mail, KeyRound, AlertCircle, RefreshCw, X, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth';
import { User } from '../../types';

interface TwoFactorChallengeModalProps {
  isOpen: boolean;
  tempToken: string;
  method: 'totp' | 'email';
  maskedEmail?: string;
  emailOtpPreview?: string;
  onSuccess: (token: string, user: User) => void;
  onCancel: () => void;
}

export const TwoFactorChallengeModal: React.FC<TwoFactorChallengeModalProps> = ({
  isOpen,
  tempToken,
  method: initialMethod,
  maskedEmail,
  emailOtpPreview,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState<string>('');
  const [useBackup, setUseBackup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | undefined>(emailOtpPreview);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, useBackup]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const val = value.slice(-1);
    if (val && !/^\d$/.test(val)) return;

    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setError('');

    // Auto-advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (val && index === 5 && newDigits.every((d) => d !== '')) {
      handleSubmit(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const pasteDigits = paste.split('');
      setDigits(pasteDigits);
      inputRefs.current[5]?.focus();
      handleSubmit(paste);
    }
  };

  const handleSubmit = async (codeToSubmit?: string) => {
    const code = codeToSubmit || (useBackup ? backupCode.trim() : digits.join(''));
    if (!code) {
      setError(useBackup ? 'Please enter a backup recovery code.' : 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }

      const res = await authApi.validateTwoFactorLogin({
        tempToken,
        code,
        isBackupCode: useBackup,
      });

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 40, 30]);
      }

      onSuccess(res.token, res.user);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Code is incorrect or expired.');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.resendEmailOtp(tempToken);
      if (res.emailPreviewUrl) {
        setLivePreviewUrl(res.emailPreviewUrl);
      }
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Could not resend email code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 460,
          padding: '28px',
          textAlign: 'center',
          border: '1px solid var(--border-color-glow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
            <ShieldCheck size={16} color="var(--primary)" />
            <span>High-Security Custody</span>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          {useBackup ? (
            <KeyRound size={28} />
          ) : initialMethod === 'email' ? (
            <Mail size={28} />
          ) : (
            <Smartphone size={28} />
          )}
        </div>

        <h3 style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}>
          2-Step Verification
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.5 }}>
          {useBackup
            ? 'Enter one of your 8-character backup recovery codes.'
            : initialMethod === 'email'
            ? `Enter the 6-digit code sent to ${maskedEmail || 'your verified email'}.`
            : 'Enter the 6-digit code from Google Authenticator, Microsoft Authenticator, or 1Password.'}
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
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {livePreviewUrl && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#06b6d4',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            📬 <strong>Dev Email Code:</strong>{' '}
            <a href={livePreviewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
              View in Ethereal Web Inbox
            </a>
          </div>
        )}

        {!useBackup ? (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 16,
              }}
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: 44,
                    height: 52,
                    fontSize: 22,
                    fontWeight: 700,
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderColor: digit ? 'var(--primary)' : 'var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    boxShadow: digit ? '0 0 0 2px var(--primary-glow)' : 'none',
                    outline: 'none',
                    transition: 'var(--transition)',
                  }}
                />
              ))}
            </div>

            {initialMethod === 'email' && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || isLoading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                  fontSize: 13,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
                <span>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Email Code'}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="e.g. A8B2-9F1C"
              value={backupCode}
              onChange={(e) => {
                setBackupCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="input-control"
              style={{
                textAlign: 'center',
                fontSize: 18,
                letterSpacing: 2,
                fontFamily: 'monospace',
                padding: '12px',
              }}
              autoFocus
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Recovery codes are single-use emergency keys created when you enabled 2FA.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSubmit()}
            disabled={isLoading || (!useBackup && digits.some((d) => d === '')) || (useBackup && !backupCode)}
            style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center' }}
          >
            {isLoading ? 'Verifying Credentials...' : 'Verify & Access Vault'}
          </button>

          <button
            type="button"
            onClick={() => {
              setUseBackup(!useBackup);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px',
            }}
          >
            {useBackup ? (
              <>
                <ArrowLeft size={14} />
                <span>Back to Authenticator / Email Code</span>
              </>
            ) : (
              <>
                <KeyRound size={14} />
                <span>Don't have your phone? Use a Recovery Backup Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
