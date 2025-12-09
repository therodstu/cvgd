import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService, User } from '../services/userService';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initUser = async () => {
      if (userService.isAuthenticated()) {
        try {
          const currentUser = await userService.getCurrentUserInfo();
          setUser(currentUser);
        } catch (error) {
          // Token might be invalid, clear it
          userService.logout();
        }
      }
      setLoading(false);
    };
    initUser();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await userService.login(email, password);
    setUser(result.user);
  };

  const logout = () => {
    userService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (userService.isAuthenticated()) {
      try {
        const currentUser = await userService.getCurrentUserInfo();
        setUser(currentUser);
      } catch (error) {
        logout(); // Logout if token is invalid
      }
    }
  };

  const value: UserContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshUser
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};




