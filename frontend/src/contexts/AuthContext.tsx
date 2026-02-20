import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  login: (token: string, userId: string, email: string, name: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that manages authentication state
 * Persists authentication state in localStorage
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('user_id');
    const storedEmail = localStorage.getItem('user_email');
    const storedName = localStorage.getItem('petpal_user');

    if (token) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
      setUserEmail(storedEmail);
      setUserName(storedName);
      return true;
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
      setUserName(null);
      return false;
    }
  };

  const login = (token: string, userId: string, email: string, name: string) => {
    // Store authentication data
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_email', email);
    localStorage.setItem('petpal_user', name);

    // Update state
    setIsAuthenticated(true);
    setUserId(userId);
    setUserEmail(email);
    setUserName(name);
  };

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('petpal_user');
    
    // Clear onboarding data
    localStorage.removeItem('onboarding_start_time');
    localStorage.removeItem('start_tour');
    localStorage.removeItem('tour_completed');

    // Update state
    setIsAuthenticated(false);
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
  };

  const checkAuth = () => {
    return checkAuthStatus();
  };

  const value: AuthContextType = {
    isAuthenticated,
    userId,
    userEmail,
    userName,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
