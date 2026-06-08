import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST';
  phone: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  tenantName: string;
  loading: boolean;
  login: (token: string, userData: User, clinicName: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const login = (token: string, userData: User, clinicName: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setTenantName(clinicName);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTenantName('');
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
      setTenantName(data.tenantName);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Auth verification failed', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        tenantName,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
