import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Search, Filter, MoreVertical, Shield, ShieldOff, Key, Eye } from 'lucide-react';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const { users, getUserStats, updateUserStatus, resetUserPassword } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatus(userId, !currentStatus);
  };

  const handleResetPassword = (userId: string) => {
    const newPassword = prompt('Enter new password for user:');
    if (newPassword) {
      resetUserPassword(userId, newPassword);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="user-management fade-in">
      <div className="user-management-header">
        <h1 className="admin-page-heading">User Management</h1>
        <p className="admin-subtitle">Manage user accounts and permissions</p>
      </div>

      <div className="user-filters">
        <div className="user-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search-input"
          />
        </div>

        <div className="user-filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="user-filter-select"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const stats = getUserStats(user.id);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.fullName}</div>
                        {user.isAdmin && (
                          <span className="admin-badge">
                            <Shield size={12} />
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td>
                    <div className="user-stats">
                      <span className="stat-item">{stats.completedTodos} completed</span>
                      <span className="stat-item">{stats.totalTodos} total</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="action-button"
                        onClick={() => setShowUserDetails(showUserDetails === user.id ? null : user.id)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-button"
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.isActive ? <ShieldOff size={16} /> : <Shield size={16} />}
                      </button>
                      <button
                        className="action-button"
                        onClick={() => handleResetPassword(user.id)}
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showUserDetails && (
        <div className="user-details-modal">
          <div className="user-details-content">
            <div className="user-details-header">
              <h3>User Details</h3>
              <button
                className="close-button"
                onClick={() => setShowUserDetails(null)}
              >
                ×
              </button>
            </div>
            <div className="user-details-body">
              {(() => {
                const user = users.find(u => u.id === showUserDetails);
                const stats = getUserStats(showUserDetails);
                if (!user) return null;

                return (
                  <div className="user-details-grid">
                    <div className="detail-section">
                      <h4>Profile Information</h4>
                      <div className="detail-item">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{user.fullName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{user.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="detail-section">
                      <h4>Statistics</h4>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-number">{stats.totalTodos}</div>
                          <div className="stat-label">Total Tasks</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-number">{stats.completedTodos}</div>
                          <div className="stat-label">Completed Tasks</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;