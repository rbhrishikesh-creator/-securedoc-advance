import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TwoFactorChallengeModal } from '../components/auth/TwoFactorChallengeModal';
import { User } from '../types';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillAdminCredentials = () => {
    setEmail('rbhrishikesh@gmail.com');
    setPassword('Kesh@123');
  };

  // 2-Step Verification challenge state
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    isOpen: boolean;
    tempToken: string;
    method: 'totp' | 'email';
    maskedEmail?: string;
    emailOtpPreview?: string;
  } | null>(null);

  const { login, completeTwoFactorLogin } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      const res = await login({ email, password });

      if (res.requires2FA && res.tempToken) {
        // Intercepted by 2FA: open challenge modal
        setTwoFactorChallenge({
          isOpen: true,
          tempToken: res.tempToken,
          method: res.method || 'totp',
          maskedEmail: res.maskedEmail,
          emailOtpPreview: res.emailOtpPreview,
        });
        return;
      }

      onNavigate('dashboard');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSuccess = (token: string, authedUser: User) => {
    setTwoFactorChallenge(null);
    completeTwoFactorLogin(token, authedUser);
    onNavigate('dashboard');
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Sign In to SecureDoc</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Zero-plaintext encrypted document custody
          </p>
        </div>

        {/* 1-Click Master Admin Access Quick-Fill */}
        <button
          type="button"
          onClick={fillAdminCredentials}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '9px 14px',
            marginBottom: 16,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#818cf8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Autofill Administrator Credentials: rbhrishikesh@gmail.com"
        >
          <ShieldCheck size={16} /> 1-Click Fill Master Admin (rbhrishikesh@gmail.com)
        </button>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-control"
              placeholder="officer@securedoc.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Master Password</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>
      </div>

      {/* 2-Step Verification Challenge Modal */}
      {twoFactorChallenge?.isOpen && (
        <TwoFactorChallengeModal
          isOpen={twoFactorChallenge.isOpen}
          tempToken={twoFactorChallenge.tempToken}
          method={twoFactorChallenge.method}
          maskedEmail={twoFactorChallenge.maskedEmail}
          emailOtpPreview={twoFactorChallenge.emailOtpPreview}
          onSuccess={handleTwoFactorSuccess}
          onCancel={() => setTwoFactorChallenge(null)}
        />
      )}
    </div>
  );
};
