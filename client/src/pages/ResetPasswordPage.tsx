import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useToast } from '../context/ToastContext';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Mismatch', message: 'Passwords do not match.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.resetPassword({ token, newPassword });
      setIsDone(true);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed. You may now sign in.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Set New Master Password</h2>
        </div>

        {isDone ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Password Reset Complete</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Your new password is now active. Please sign in with your updated credentials.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
              Sign In Now <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Reset Token</label>
              <input
                type="text"
                className="input-control"
                placeholder="64-character token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">New Password (min 8 characters)</label>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: 8 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Change Password'} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
