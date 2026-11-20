import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const saved = localStorage.getItem('aph_auth_user') || localStorage.getItem('ewccms_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback to default
      }
    }
    return mockUsers[0]; // Default to Super Admin
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const val = localStorage.getItem('aph_logged_in') ?? localStorage.getItem('ewccms_logged_in');
    return val !== 'false';
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('aph_auth_user', JSON.stringify(user));
  };

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Look for existing user in mock data
    const matchedUser = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
      const loggedUser = {
        ...matchedUser,
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setCurrentUser(loggedUser);
      setIsAuthenticated(true);
      localStorage.setItem('aph_logged_in', 'true');
      return { success: true };
    }

    // Allow any valid email to sign in as staff
    if (cleanEmail.includes('@')) {
      const customUser: User = {
        id: `u-${Date.now()}`,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
        email: cleanEmail,
        role: 'Admin',
        active: true,
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setCurrentUser(customUser);
      setIsAuthenticated(true);
      localStorage.setItem('aph_logged_in', 'true');
      return { success: true };
    }

    return {
      success: false,
      message: 'Please provide a valid official hospital email address.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('aph_logged_in', 'false');
    localStorage.removeItem('aph_auth_user');
  };

  const switchRole = (role: UserRole) => {
    const userForRole = mockUsers.find((u) => u.role === role) || {
      ...mockUsers[0],
      role,
      name: `${role} User`,
    };
    setCurrentUser(userForRole);
  };

  const hasPermission = (permission: string): boolean => {
    const role = currentUser.role;
    if (role === 'Super Admin') return true;

    switch (permission) {
      case 'manage_users':
      case 'manage_wati':
        return false;
      case 'approve_campaign':
        return role === 'Admin' || role === 'Approver';
      case 'create_campaign':
      case 'edit_campaign':
        return role === 'Admin' || role === 'Campaign Creator';
      case 'manage_employees':
      case 'import_employees':
      case 'manage_categories':
      case 'manage_departments':
      case 'manage_consent':
      case 'retry_failures':
        return role === 'Admin';
      case 'view_reports':
      case 'view_history':
        return true;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        setCurrentUser,
        switchRole,
        hasPermission,
      }}
    >
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
