import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'user' | 'hospital' | 'doctor';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  // Hospital specific
  hospitalId?: string;
  // Doctor specific
  doctorId?: string;
  // User specific
  selectedCity?: string;
  selectedArea?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (userData: Partial<AuthUser> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = '@medbook_auth';
const USERS_KEY = '@medbook_users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStoredUsers = async (): Promise<AuthUser[]> => {
    try {
      const users = await AsyncStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  };

  const saveUsers = async (users: AuthUser[]) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const users = await getStoredUsers();
      const foundUser = users.find(u => u.email === email && u.role === role);
      
      if (foundUser) {
        setUser(foundUser);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
        return true;
      }
      
      // For demo: auto-create user if not found
      const newUser: AuthUser = {
        id: uuidv4(),
        email,
        name: email.split('@')[0],
        role,
      };
      
      const updatedUsers = [...users, newUser];
      await saveUsers(updatedUsers);
      setUser(newUser);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (userData: Partial<AuthUser> & { password: string }): Promise<boolean> => {
    try {
      const users = await getStoredUsers();
      const existingUser = users.find(u => u.email === userData.email);
      
      if (existingUser) {
        return false; // User already exists
      }

      const newUser: AuthUser = {
        id: uuidv4(),
        email: userData.email!,
        name: userData.name!,
        role: userData.role!,
        phone: userData.phone,
        hospitalId: userData.hospitalId,
        doctorId: userData.doctorId,
      };

      const updatedUsers = [...users, newUser];
      await saveUsers(updatedUsers);
      setUser(newUser);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (data: Partial<AuthUser>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      
      // Also update in users list
      const users = await getStoredUsers();
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      await saveUsers(updatedUsers);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
