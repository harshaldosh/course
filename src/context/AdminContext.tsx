import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plan, Coupon, UserProfile, UserStats } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface AdminContextType {
  // Plans
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => Plan | undefined;
  
  // Coupons
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  getCouponByCode: (code: string) => Coupon | undefined;
  
  // Users
  users: UserProfile[];
  getUserStats: (userId: string) => UserStats;
  updateUserStatus: (userId: string, isActive: boolean) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  
  // Admin verification
  isAdmin: (email: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('admin_plans');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default plans
    const defaultPlans: Plan[] = [
      {
        id: uuidv4(),
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: false,
          prioritySupport: false,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Pro',
        description: 'For professional users',
        price: 29,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: true,
          prioritySupport: true,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Enterprise',
        description: 'For teams and organizations',
        price: 99,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: true,
          prioritySupport: true,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    
    return defaultPlans;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('admin_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('admin_users');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('admin_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('admin_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users));
  }, [users]);

  const addPlan = (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: Plan = {
      ...plan,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlans(prev => [...prev, newPlan]);
    toast.success('Plan added successfully');
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans(prev =>
      prev.map(plan =>
        plan.id === id ? { ...plan, ...updates, updatedAt: Date.now() } : plan
      )
    );
    toast.success('Plan updated successfully');
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== id));
    toast.success('Plan deleted successfully');
  };

  const getPlanById = (id: string) => {
    return plans.find(plan => plan.id === id);
  };

  const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: uuidv4(),
      usedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCoupons(prev => [...prev, newCoupon]);
    toast.success('Coupon added successfully');
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    setCoupons(prev =>
      prev.map(coupon =>
        coupon.id === id ? { ...coupon, ...updates, updatedAt: Date.now() } : coupon
      )
    );
    toast.success('Coupon updated successfully');
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(coupon => coupon.id !== id));
    toast.success('Coupon deleted successfully');
  };

  const getCouponByCode = (code: string) => {
    return coupons.find(coupon => 
      coupon.code.toLowerCase() === code.toLowerCase() && 
      coupon.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > Date.now()) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
    );
  };

  const getUserStats = (userId: string): UserStats => {
    // This would typically fetch from a database
    // For now, return mock data
    return {
      totalTodos: 15,
      completedTodos: 10,
    };
  };

  const updateUserStatus = (userId: string, isActive: boolean) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isActive } : user
      )
    );
    toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    // This would typically call an API to reset the password
    toast.success('Password reset successfully');
  };

  const isAdmin = (email: string) => {
    return email === 'harshal9901@gmail.com';
  };

  return (
    <AdminContext.Provider
      value={{
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        getPlanById,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        getCouponByCode,
        users,
        getUserStats,
        updateUserStatus,
        resetUserPassword,
        isAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};