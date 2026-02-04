import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export type UserRole = 'user' | 'hospital' | 'doctor';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  specialization?: string;
  degree?: string;
  experience?: number;
  consultation_fee?: number;
  available_days?: string[];
  available_slots?: string[];
  rating?: number;
  address?: string;
  city?: string;
  area?: string;
  state?: string;
  pincode?: string;
  departments?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role: UserRole;
    specialization?: string;
    degree?: string;
    experience?: number;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    departments?: string[];
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = '@medbook_auth';

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
        const userData = JSON.parse(storedUser);
        // Verify user still exists in backend
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/user/${userData.id}`);
          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
            await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(freshUser));
          } else {
            // User no longer exists in backend
            await AsyncStorage.removeItem(AUTH_KEY);
            setUser(null);
          }
        } catch {
          // Network error - use cached user
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (userData: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role: UserRole;
    specialization?: string;
    degree?: string;
    experience?: number;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    departments?: string[];
  }): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUser(newUser);
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
        return { success: true, user: newUser };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
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
