export enum TodoStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  createdAt: number;
  dueDate?: number;
}

export interface BackupData {
  todos: Todo[];
  lastBackupDate: number;
}

// Admin and Plan Management Types
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: PlanFeatures;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlanFeatures {
  todoboardEnabled: boolean;
  customDomain: boolean;
  prioritySupport: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercentage: number;
  applicablePlans: string[];
  isActive: boolean;
  expiresAt?: number;
  usageLimit?: number;
  usedCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: number;
  endDate: number;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  razorpaySubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  subscription?: UserSubscription;
  createdAt: number;
  lastLoginAt: number;
  isActive: boolean;
}

export interface UserStats {
  totalTodos: number;
  completedTodos: number;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  planId: string;
  couponId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  paymentMethod: 'stripe' | 'razorpay';
  createdAt: number;
}