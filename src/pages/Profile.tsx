import React, { useState, useEffect } from 'react';
import { User, Settings, Lock, LogOut, Eye, EyeOff, CreditCard, Crown, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTodos } from '../context/TodoContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, signOut, updateUserProfile, updateUserPassword } = useAuth();
  const { currentPlan, currentSubscription } = useSubscription();
  const { todos } = useTodos();
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Update fullName when user data changes
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setProfileLoading(true);
    try {
      await updateUserProfile(fullName.trim());
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsageStats = () => {
    const completedTodos = todos.filter(todo => todo.status === 'done').length;
    const totalTodos = todos.length;
    
    return {
      completedTodos,
      totalTodos
    };
  };

  const usage = getUsageStats();

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <h1 className="page-heading">Profile Settings</h1>
        <p className="subtitle">Manage your account settings and preferences</p>
      </div>

      <div className="profile-grid">
        <div className="profile-section">
          <h2 className="section-title">
            <User size={20} />
            Profile Information
          </h2>
          
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitials()}
            </div>
            <div className="user-details">
              <h3>{user?.user_metadata?.full_name || 'User'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                className="form-input"
                disabled
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="button-primary"
                disabled={profileLoading || !fullName.trim()}
              >
                {profileLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-section">
          <h2 className="section-title">
            <CreditCard size={20} />
            Account & Subscription
          </h2>
          
          <div className="subscription-info">
            <div className="current-plan">
              <div className="plan-header">
                <div className="plan-name-badge">
                  <Crown size={16} />
                  <span>{currentPlan?.name || 'Free'} Plan</span>
                </div>
                <Link to="/pricing" className="upgrade-link">
                  <span>Upgrade</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              
              <div className="plan-description">
                <p>{currentPlan?.description || 'Basic features for getting started'}</p>
              </div>
            </div>

            <div className="usage-stats">
              <h4>Current Usage</h4>
              <div className="usage-grid">
                <div className="usage-item">
                  <span className="usage-label">Total Tasks</span>
                  <span className="usage-value">{usage.totalTodos}</span>
                </div>
                <div className="usage-item">
                  <span className="usage-label">Completed Tasks</span>
                  <span className="usage-value">{usage.completedTodos}</span>
                </div>
                <div className="usage-item">
                  <span className="usage-label">Completion Rate</span>
                  <span className="usage-value">
                    {usage.totalTodos > 0 ? Math.round((usage.completedTodos / usage.totalTodos) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="plan-features">
              <h4>Plan Features</h4>
              <div className="features-list">
                <div className={`feature-item ${currentPlan?.features.todoboardEnabled ? 'enabled' : 'disabled'}`}>
                  <span>Kanban Boards</span>
                </div>
                <div className={`feature-item ${currentPlan?.features.customDomain ? 'enabled' : 'disabled'}`}>
                  <span>Custom Domain</span>
                </div>
                <div className={`feature-item ${currentPlan?.features.prioritySupport ? 'enabled' : 'disabled'}`}>
                  <span>Priority Support</span>
                </div>
              </div>
            </div>

            {currentPlan?.price && currentPlan.price > 0 && (
              <div className="billing-info">
                <h4>Billing Information</h4>
                <div className="info-item">
                  <span className="info-label">Plan Price</span>
                  <span className="info-value">${currentPlan.price}/{currentPlan.billingPeriod}</span>
                </div>
                {currentSubscription && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className={`status-badge status-${currentSubscription.status}`}>
                        {currentSubscription.status}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Next Billing</span>
                      <span className="info-value">
                        {new Date(currentSubscription.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">
            <Settings size={20} />
            Account Information
          </h2>
          
          <div className="info-item">
            <span className="info-label">Account Created</span>
            <span className="info-value">
              {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Last Sign In</span>
            <span className="info-value">
              {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Unknown'}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Email Status</span>
            <span className={`status-badge ${user?.email_confirmed_at ? 'status-verified' : 'status-unverified'}`}>
              {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
            </span>
          </div>

          <div className="danger-zone">
            <h4>Sign Out</h4>
            <p>Sign out of your account on this device.</p>
            <button onClick={handleSignOut} className="button-danger">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        <div className="profile-section" style={{ gridColumn: 'span 2' }}>
          <h2 className="section-title">
            <Lock size={20} />
            Change Password
          </h2>
          
          <form onSubmit={handlePasswordUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="password-toggle"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={
                  passwordLoading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 6
                }
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;