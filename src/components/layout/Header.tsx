import React from 'react';
import { Menu, Bell, Sun, Moon, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };
  
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>
      
      <div className="header-search">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="icon-button" onClick={handleSignOut} aria-label="Sign out">
          <LogOut size={20} />
        </button>
        <div className="user-profile">
          <div 
            className="avatar" 
            title={user?.email}
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
          >
            <span>{getUserInitials()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;