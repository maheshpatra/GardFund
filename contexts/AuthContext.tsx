import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

interface User {
  id: number;
  member_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  level_id: number;
  level_name?: string;
  badge_color?: string;
  badge_icon?: string;
  total_points: number;
  avatar_url?: string;
  is_verified: boolean;
  joined_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        ApiService.setToken(storedToken);
        
        // Sync the latest profile natively in the background
        try {
          const response = await ApiService.getProfile();
          setUser(response.data);
          await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
        } catch (syncErr) {
          console.log('Background auth sync failed:', syncErr);
        }
      }
    } catch (e) {
      console.log('Error loading auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await ApiService.login(email, password);
    const { token: newToken, user: userData } = response.data;
    setToken(newToken);
    setUser(userData);
    ApiService.setToken(newToken);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const register = async (data: any) => {
    await ApiService.register(data);
    // User is no longer logged in automatically. They must wait for admin approval.
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    ApiService.setToken(null);
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
  };

  const refreshProfile = async () => {
    try {
      const response = await ApiService.getProfile();
      setUser(response.data);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
    } catch (e) {
      console.log('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
