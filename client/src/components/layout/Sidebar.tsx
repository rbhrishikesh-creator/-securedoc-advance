import React from 'react';
import { Files, Share2, ShieldAlert, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'My Documents', icon: Files },
    { id: 'shared', label: 'Shared With Me', icon: Share2 },
    { id: 'profile', label: 'Security & Profile', icon: UserCheck },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin & Access Control', icon: ShieldAlert });
  }

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: 240,
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 8 }}>
          Workspace Custody
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid transparent',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  borderColor: isActive ? 'var(--border-color-glow)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security posture card */}
      <div
        className="glass-panel"
        style={{
          padding: '16px',
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ShieldCheck size={18} color="#10b981" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>AES-256 Active</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          All payload buffers are encrypted on upload with unique 12-byte IVs.
        </p>
      </div>
    </aside>
  );
};
