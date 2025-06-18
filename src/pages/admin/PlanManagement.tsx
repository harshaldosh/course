import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plan, PlanFeatures } from '../../types';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import './PlanManagement.css';

const PlanManagement: React.FC = () => {
  const { plans, addPlan, updatePlan, deletePlan } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly' as 'monthly' | 'yearly',
    features: {
      todoboardEnabled: true,
      customDomain: false,
      prioritySupport: false,
    } as PlanFeatures,
    isActive: true,
  });

  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: {
        todoboardEnabled: true,
        customDomain: false,
        prioritySupport: false,
      },
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      features: { ...plan.features },
      isActive: plan.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlan) {
      updatePlan(editingPlan.id, formData);
    } else {
      addPlan(formData);
    }
    
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deletePlan(planId);
    }
  };

  const handleFeatureChange = (feature: keyof PlanFeatures, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value,
      },
    }));
  };

  return (
    <div className="plan-management fade-in">
      <div className="plan-management-header">
        <div>
          <h1 className="admin-page-heading">Plan Management</h1>
          <p className="admin-subtitle">Create and manage subscription plans</p>
        </div>
        <button className="add-plan-button" onClick={handleAddPlan}>
          <Plus size={18} />
          <span>Add Plan</span>
        </button>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <div className="plan-title-section">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>
              <div className="plan-actions">
                <button
                  className="plan-action-button"
                  onClick={() => handleEditPlan(plan)}
                  title="Edit Plan"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="plan-action-button delete"
                  onClick={() => handleDeletePlan(plan.id)}
                  title="Delete Plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="plan-pricing">
              <span className="plan-price">${plan.price}</span>
              <span className="plan-period">/{plan.billingPeriod}</span>
            </div>

            <div className="plan-features">
              <div className="feature-item">
                <span className="feature-label">Kanban Boards:</span>
                <span className={`feature-status ${plan.features.todoboardEnabled ? 'enabled' : 'disabled'}`}>
                  {plan.features.todoboardEnabled ? <Check size={16} /> : <X size={16} />}
                </span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Custom Domain:</span>
                <span className={`feature-status ${plan.features.customDomain ? 'enabled' : 'disabled'}`}>
                  {plan.features.customDomain ? <Check size={16} /> : <X size={16} />}
                </span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Priority Support:</span>
                <span className={`feature-status ${plan.features.prioritySupport ? 'enabled' : 'disabled'}`}>
                  {plan.features.prioritySupport ? <Check size={16} /> : <X size={16} />}
                </span>
              </div>
            </div>

            <div className="plan-status">
              <span className={`status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="plan-modal-overlay">
          <div className="plan-modal">
            <div className="plan-modal-header">
              <h2>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="plan-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Plan Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price</label>
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Currency</label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="form-input"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="billingPeriod">Billing Period</label>
                  <select
                    id="billingPeriod"
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingPeriod: e.target.value as 'monthly' | 'yearly' }))}
                    className="form-input"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="form-input"
                />
              </div>

              <div className="features-section">
                <h3>Features</h3>
                
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.features.todoboardEnabled}
                      onChange={(e) => handleFeatureChange('todoboardEnabled', e.target.checked)}
                    />
                    <span>Enable Kanban Boards</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.features.customDomain}
                      onChange={(e) => handleFeatureChange('customDomain', e.target.checked)}
                    />
                    <span>Custom Domain</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.features.prioritySupport}
                      onChange={(e) => handleFeatureChange('prioritySupport', e.target.checked)}
                    />
                    <span>Priority Support</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span>Active Plan</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;