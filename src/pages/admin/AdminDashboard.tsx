import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Users, CreditCard, Tag, TrendingUp, DollarSign, UserCheck } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { plans, coupons, users } = useAdmin();
  
  const activePlans = plans.filter(plan => plan.isActive);
  const activeCoupons = coupons.filter(coupon => coupon.isActive);
  const activeUsers = users.filter(user => user.isActive);
  
  const totalRevenue = activePlans.reduce((sum, plan) => sum + plan.price, 0);
  
  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-dashboard-header">
        <h1 className="admin-page-heading">Admin Dashboard</h1>
        <p className="admin-subtitle">Overview of your platform's performance</p>
      </div>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Users size={24} color="#3B82F6" />
          </div>
          <div className="admin-stat-content">
            <h2 className="admin-stat-value">{users.length}</h2>
            <p className="admin-stat-label">Total Users</p>
            <p className="admin-stat-change">+{activeUsers.length} active</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CreditCard size={24} color="#10B981" />
          </div>
          <div className="admin-stat-content">
            <h2 className="admin-stat-value">{activePlans.length}</h2>
            <p className="admin-stat-label">Active Plans</p>
            <p className="admin-stat-change">{plans.length} total</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <Tag size={24} color="#F59E0B" />
          </div>
          <div className="admin-stat-content">
            <h2 className="admin-stat-value">{activeCoupons.length}</h2>
            <p className="admin-stat-label">Active Coupons</p>
            <p className="admin-stat-change">{coupons.length} total</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <DollarSign size={24} color="#8B5CF6" />
          </div>
          <div className="admin-stat-content">
            <h2 className="admin-stat-value">${totalRevenue}</h2>
            <p className="admin-stat-label">Monthly Revenue</p>
            <p className="admin-stat-change">Potential</p>
          </div>
        </div>
      </div>
      
      <div className="admin-dashboard-content">
        <div className="admin-recent-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Plans</h2>
          </div>
          
          <div className="admin-plans-list">
            {activePlans.slice(0, 3).map(plan => (
              <div key={plan.id} className="admin-plan-item">
                <div className="admin-plan-info">
                  <h3 className="admin-plan-name">{plan.name}</h3>
                  <p className="admin-plan-description">{plan.description}</p>
                </div>
                <div className="admin-plan-price">
                  <span className="admin-price-amount">${plan.price}</span>
                  <span className="admin-price-period">/{plan.billingPeriod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="admin-recent-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Coupons</h2>
          </div>
          
          <div className="admin-coupons-list">
            {activeCoupons.slice(0, 3).map(coupon => (
              <div key={coupon.id} className="admin-coupon-item">
                <div className="admin-coupon-info">
                  <h3 className="admin-coupon-code">{coupon.code}</h3>
                  <p className="admin-coupon-description">{coupon.description}</p>
                </div>
                <div className="admin-coupon-discount">
                  <span className="admin-discount-amount">{coupon.discountPercentage}%</span>
                  <span className="admin-discount-label">OFF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="admin-quick-actions">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-actions-grid">
          <button className="admin-action-button">
            <Users size={20} />
            <span>Add New User</span>
          </button>
          <button className="admin-action-button">
            <CreditCard size={20} />
            <span>Create Plan</span>
          </button>
          <button className="admin-action-button">
            <Tag size={20} />
            <span>Generate Coupon</span>
          </button>
          <button className="admin-action-button">
            <TrendingUp size={20} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;