import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from '../../components/feedback/LoadingScreen';

export const AuthGuard = ({ children, allowedRoles }) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    // Redirect to login but save current location for redirects
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role checks are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      if (userRole === 'CUSTOMER') {
        return <Navigate to="/" replace />;
      }
      // If role not allowed, redirect to unauthorized/dashboard
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};
