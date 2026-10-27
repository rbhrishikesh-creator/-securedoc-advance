import React from 'react';
import { Files, Share2, UserCheck, ShieldAlert, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenUpload: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onOpenUpload }) => {
  const { user } = useAuth();

  const handleTabClick = (tabId: string) => {
    // Trigger subtle haptic pulse if available on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onTabChange(tabId);
  };

  const handleUploadClick = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onOpenUpload();
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => handleTabClick('dashboard')}
      >
        <Files size={20} />
        <span>Vault</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'shared' ? 'active' : ''}`}
        onClick={() => handleTabClick('shared')}
      >
        <Share2 size={20} />
        <span>Shared</span>
      </button>

      {/* Center Floating Action Button for Quick Upload / Scan */}
      <button
        type="button"
        className="mobile-upload-fab"
        onClick={handleUploadClick}
        aria-label="Upload or Scan Document"
        title="Upload or Scan Document"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
        onClick={() => handleTabClick('profile')}
      >
        <UserCheck size={20} />
        <span>Profile</span>
      </button>

      {user?.role === 'admin' ? (
        <button
          type="button"
          className={`mobile-nav-item ${currentTab === 'admin' ? 'active' : ''}`}
          onClick={() => handleTabClick('admin')}
        >
          <ShieldAlert size={20} />
          <span>Admin</span>
        </button>
      ) : null}
    </nav>
  );
};
