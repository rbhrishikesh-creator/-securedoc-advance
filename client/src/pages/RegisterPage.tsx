import React, { useState } from 'react';
import { Shield, Mail, CheckCircle2, ArrowRight, ExternalLink, RefreshCw, Sparkles, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

interface RegistrationSuccessData {
  email: string;
  name: string;
  token?: string;
  devVerifyUrl?: string;
  emailPreviewUrl?: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);

  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      setIsSubmitting(true);
      const res = await register({ name, email, password });
      setSuccessData({
        email,
        name,
        token: res.token,
        devVerifyUrl: res.devVerifyUrl,
        emailPreviewUrl: res.emailPreviewUrl,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!successData?.email) return;
    try {
      setIsResending(true);
      const res = await authApi.resendVerification(successData.email);
      if (res.devVerifyUrl) {
        setSuccessData((prev) => prev ? { ...prev, devVerifyUrl: res.devVerifyUrl, emailPreviewUrl: (res as any).emailPreviewUrl } : null);
      }
      showToast({
        type: 'success',
        title: 'Email Resent',
        message: 'A fresh single-use verification email has been dispatched.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Resend Failed',
        message: err.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const getWebmailUrl = (userEmail: string) => {
    const domain = userEmail.split('@')[1]?.toLowerCase() || '';
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      return { name: 'Open Gmail Inbox', url: 'https://mail.google.com/' };
    }
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
      return { name: 'Open Outlook Inbox', url: 'https://outlook.live.com/' };
    }
    if (domain === 'yahoo.com') {
      return { name: 'Open Yahoo Mail', url: 'https://mail.yahoo.com/' };
    }
    return { name: 'Open Webmail', url: `https://${domain}` };
  };

  // If successfully registered, show the Verification Dispatched screen
  if (successData) {
    const webmail = getWebmailUrl(successData.email);

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
        <div className="glass-panel" style={{ maxWidth: 540, width: '100%', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                marginBottom: 16,
              }}
            >
              <Mail size={32} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Check Your Email</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              We've dispatched a cryptographic single-use verification email to:
              <br />
              <strong style={{ color: '#ffffff', fontSize: 15, background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginTop: 6 }}>
                {successData.email}
              </strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Direct Webmail Link */}
            <a
              href={webmail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
            >
              <Inbox size={18} /> {webmail.name} <ExternalLink size={14} />
            </a>

            {/* If using Ethereal sandbox, show test web inbox */}
            {successData.emailPreviewUrl && (
              <a
                href={successData.emailPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22d3ee' }}
              >
                <Sparkles size={16} /> Open Test Web Inbox (Rendered Email) <ExternalLink size={14} />
              </a>
            )}

            {/* Direct Instant Verify Button */}
            {successData.devVerifyUrl && (
              <a
                href={successData.devVerifyUrl}
                className="btn btn-outline"
                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                <CheckCircle2 size={16} color="#10b981" /> ⚡ Click to Verify Email Address Now
              </a>
            )}
          </div>

          <div
            style={{
              padding: 16,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0 }}>
              💡 <strong>Real Email Delivery</strong>: By default in development, if no custom SMTP credentials are in <code style={{ color: '#818cf8' }}>server/.env</code>, emails are simulated with a live web preview. To receive real emails in your personal inbox, provide your Gmail App Password or SMTP credentials in <code style={{ color: '#818cf8' }}>server/.env</code>.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              {isResending ? 'Resending...' : 'Resend Email'}
            </button>

            <button
              onClick={() => onNavigate('login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Sign In <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form View
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Create Secure Vault Account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Accounts require email verification before document storage
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-control"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-control"
              placeholder="jane.doe@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Master Password (min 8 characters)</label>
            <input
              type="password"
              className="input-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isSubmitting ? 'Registering...' : 'Register Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
