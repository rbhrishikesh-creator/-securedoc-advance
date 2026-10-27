import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, onTabChange, children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar currentTab={currentTab} onTabChange={onTabChange} />
        <main
          className="app-main-content"
          style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'transparent' }}
        >
          {children}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar for Mobile Phones and Tablets */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={onTabChange}
        onOpenUpload={() => onTabChange('dashboard')}
      />
    </div>
  );
};
