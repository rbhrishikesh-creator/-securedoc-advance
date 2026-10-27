import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, Loader } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface VerifyEmailPageProps {
  onNavigate: (page: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    user?.isVerified ? 'success' : 'verifying'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [manualToken, setManualToken] = useState('');

  const verifyToken = async (token: string) => {
    try {
      setStatus('verifying');
      await authApi.verifyEmail(token);
      setStatus('success');
      await refreshUser();
    } catch (err: any) {
      // If the current logged-in user is already verified in database, don't show failure
      if (user?.isVerified) {
        setStatus('success');
        return;
      }
      setStatus('error');
      setErrorMessage(err.message || 'Token is invalid, expired, or was already used.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    } else {
      setStatus('error');
      setErrorMessage('No verification token provided in URL. You can paste your single-use token below.');
    }
  }, []);

  const handleGoToDashboard = () => {
    window.history.pushState({}, '', '/');
    if (user) {
      onNavigate('dashboard');
    } else {
      onNavigate('login');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div className="glass-panel" style={{ maxWidth: 480, width: '100%', padding: '40px', textAlign: 'center' }}>
        {status === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
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
              <Loader size={28} color="#6366f1" className="animate-spin" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Verifying Cryptographic Token...</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Atomically validating and consuming single-use verification token via Redis.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Account Verified!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your email address has been verified. You now have full permission to upload, encrypt, share, and collaborate on documents.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%' }}
              onClick={handleGoToDashboard}
            >
              Go to Workspace Dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={32} color="#f43f5e" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f43f5e' }}>Verification Link Used or Expired</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {errorMessage}
            </p>

            <button
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%' }}
              onClick={handleGoToDashboard}
            >
              Go to Workspace Dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
