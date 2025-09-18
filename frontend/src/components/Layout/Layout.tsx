'use client';

import React, { useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const Layout: React.FC<LayoutProps> = ({ children, requiredRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading, isAuthorized } = useRequireAuth(requiredRole);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-secondary-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authorized (redirect will happen in useRequireAuth)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Header */}
          <Header onMenuClick={handleSidebarToggle} />
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
