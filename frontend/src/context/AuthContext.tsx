import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]); // Default to Super Admin

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
    <AuthContext.Provider value={{ currentUser, setCurrentUser, switchRole, hasPermission }}>
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
