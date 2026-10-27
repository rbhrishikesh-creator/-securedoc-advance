import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, LoginResponse } from '../api/auth';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  devVerifyUrl: string | null;
  setDevVerifyUrl: (url: string | null) => void;
  login: (data: { email: string; password: string }) => Promise<LoginResponse>;
  completeTwoFactorLogin: (token: string, user: User) => void;
  register: (data: { name: string; email: string; password: string }) => Promise<{
    message: string;
    user: User;
    token?: string;
    devVerifyUrl?: string;
    emailPreviewUrl?: string;
  }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('securedoc_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('securedoc_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      // Guarantee fast resolution even if network or proxy lags
      const fetchUser = authApi.getMe();
      const timeoutFallback = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session verification timeout')), 3000)
      );
      const data = await Promise.race([fetchUser, timeoutFallback]);
      setUser(data.user);
    } catch {
      localStorage.removeItem('securedoc_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (data: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await authApi.login(data);

    if (res.requires2FA) {
      // Intercepted by 2FA challenge - caller will open TwoFactorChallengeModal
      return res;
    }

    if (res.token && res.user) {
      localStorage.setItem('securedoc_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast({
        type: 'success',
        title: 'Authenticated',
        message: `Welcome back, ${res.user.name}!`,
      });
    }

    return res;
  };

  const completeTwoFactorLogin = (newToken: string, authedUser: User) => {
    localStorage.setItem('securedoc_token', newToken);
    setToken(newToken);
    setUser(authedUser);
    showToast({
      type: 'success',
      title: '2-Step Verification Succeeded',
      message: `Identity verified. Welcome back, ${authedUser.name}!`,
    });
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    if (res.devVerifyUrl) {
      setDevVerifyUrl(res.devVerifyUrl);
    }
    showToast({
      type: 'info',
      title: 'Account Created',
      message: 'Verification email has been dispatched.',
    });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('securedoc_token');
    setToken(null);
    setUser(null);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have safely ended your session.',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        devVerifyUrl,
        setDevVerifyUrl,
        login,
        completeTwoFactorLogin,
        register,
        logout,
        refreshUser,
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
