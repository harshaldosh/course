import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import { PlanFeatures } from '../../types';

interface FeatureRouteProps {
  children: React.ReactNode;
  feature: keyof PlanFeatures;
}

const FeatureRoute: React.FC<FeatureRouteProps> = ({ children, feature }) => {
  const { isFeatureEnabled } = useSubscription();

  if (!isFeatureEnabled(feature)) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default FeatureRoute;