import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { SharedDocumentsPage } from './pages/SharedDocumentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PublicSharePage } from './pages/PublicSharePage';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [dashboardTab, setDashboardTab] = useState<string>('dashboard');
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);

  useEffect(() => {
    // Check initial path
    const path = window.location.pathname;
    if (path.includes('/share/')) {
      const parts = path.split('/share/');
      if (parts[1]) {
        setPublicShareToken(parts[1]);
        setCurrentPage('public-share');
      }
    } else if (path.includes('verify-email')) {
      setCurrentPage('verify-email');
    } else if (path.includes('reset-password')) {
      setCurrentPage('reset-password');
    } else if (path.includes('login')) {
      setCurrentPage('login');
    } else if (path.includes('register')) {
      setCurrentPage('register');
    } else if (user) {
      setCurrentPage('app');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Initializing SecureDoc AES-GCM Cryptographic Vault...
      </div>
    );
  }

  // Handle direct public routes
  if (currentPage === 'public-share' && publicShareToken) {
    return <PublicSharePage token={publicShareToken} />;
  }

  if (currentPage === 'verify-email') {
    return <VerifyEmailPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'reset-password') {
    return <ResetPasswordPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'register' && !user) {
    return <RegisterPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'login' && !user) {
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  if (!user) {
    return <LandingPage onNavigate={setCurrentPage} />;
  }

  // Authenticated workspace routes
  return (
    <AppLayout currentTab={dashboardTab} onTabChange={setDashboardTab}>
      {dashboardTab === 'dashboard' && <DashboardPage />}
      {dashboardTab === 'shared' && <SharedDocumentsPage />}
      {dashboardTab === 'profile' && <ProfilePage />}
      {dashboardTab === 'admin' && <AdminDashboardPage />}
    </AppLayout>
  );
};

export default App;
