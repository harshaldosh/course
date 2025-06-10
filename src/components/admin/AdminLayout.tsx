import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  CreditCard, 
  Tag, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/admin' || path === '/admin/') return 'Admin Dashboard';
    if (path === '/admin/users') return 'User Management';
    if (path === '/admin/plans') return 'Plan Management';
    if (path === '/admin/coupons') return 'Coupon Management';
    if (path === '/admin/settings') return 'Admin Settings';
    
    return 'Admin Dashboard';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-logo">
            <Shield size={24} />
            <span className="admin-logo-text">Admin Panel</span>
          </Link>
          <button className="admin-close-sidebar" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="admin-sidebar-nav">
          <Link 
            to="/admin" 
            className={`admin-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <LayoutGrid size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/admin/users" 
            className={`admin-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Users</span>
          </Link>
          
          <Link 
            to="/admin/plans" 
            className={`admin-nav-link ${location.pathname === '/admin/plans' ? 'active' : ''}`}
          >
            <CreditCard size={20} />
            <span>Plans</span>
          </Link>
          
          <Link 
            to="/admin/coupons" 
            className={`admin-nav-link ${location.pathname === '/admin/coupons' ? 'active' : ''}`}
          >
            <Tag size={20} />
            <span>Coupons</span>
          </Link>
          
          <Link 
            to="/admin/settings" 
            className={`admin-nav-link ${location.pathname === '/admin/settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
        
        <div className="admin-sidebar-footer">
          <button onClick={handleSignOut} className="admin-signout-button">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      
      <div className="admin-layout-content">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-menu-button" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <h1 className="admin-header-title">{getPageTitle()}</h1>
          </div>
          
          <div className="admin-header-right">
            <Link to="/" className="admin-back-to-site">
              Back to Site
            </Link>
          </div>
        </header>
        
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;