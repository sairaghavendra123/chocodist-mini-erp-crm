import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canAccess: (module: 'dashboard' | 'customers' | 'products' | 'inventory' | 'challans') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetchApi<User>('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  const canAccess = (module: 'dashboard' | 'customers' | 'products' | 'inventory' | 'challans'): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    switch (module) {
      case 'dashboard':
        return true;
      case 'customers':
        return ['SALES', 'ACCOUNTS'].includes(user.role);
      case 'products':
        return ['WAREHOUSE'].includes(user.role);
      case 'inventory':
        return ['WAREHOUSE'].includes(user.role);
      case 'challans':
        return ['SALES', 'ACCOUNTS'].includes(user.role);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
