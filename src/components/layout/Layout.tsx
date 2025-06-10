import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/todo') return 'Todo Board';
    if (path === '/profile') return 'Profile';
    if (path === '/settings') return 'Settings';
    
    return 'Dashboard';
  };
  
  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="layout-content">
        <Header title={getPageTitle()} toggleSidebar={toggleSidebar} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;