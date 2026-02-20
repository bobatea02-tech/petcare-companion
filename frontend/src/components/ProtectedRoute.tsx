import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that checks if user is authenticated
 * Redirects to landing page if not authenticated
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAuth } = useAuth();
  
  // Double-check authentication status
  const isAuth = isAuthenticated || checkAuth();
  
  if (!isAuth) {
    // User is not authenticated, redirect to landing page
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};
