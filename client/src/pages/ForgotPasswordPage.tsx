import React, { useState } from 'react';
import { Shield, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      const res = await authApi.forgotPassword(email);
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
      setIsSubmitted(true);
      showToast({
        type: 'success',
        title: 'Reset Link Sent',
        message: 'If an account exists, a single-use reset link was dispatched.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
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
      <div className="glass-panel" style={{ maxWidth: 440, width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              marginBottom: 12,
            }}
          >
            <Shield size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Forgot Password</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Enter your email to receive a 15-minute single-use reset token
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Check your inbox for password reset instructions.
            </p>

            {devResetUrl && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  fontSize: 12,
                }}
              >
                <strong>DEV TEST LINK:</strong>
                <a
                  href={devResetUrl}
                  style={{ display: 'block', color: 'var(--primary)', marginTop: 4, wordBreak: 'break-all' }}
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-control"
                placeholder="officer@securedoc.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: 8 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Request...' : 'Send Reset Link'} <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%' }}
              onClick={() => onNavigate('login')}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
