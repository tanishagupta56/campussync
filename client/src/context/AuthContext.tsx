import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, LoginChallenge } from '../types/auth';
import { apiRequest } from '../lib/apiClient';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  initiateLogin: (email: string, password: string, selectedRole: Role) => Promise<LoginChallenge>;
  verifyOtp: (challengeId: string, otp: string) => Promise<User>;
  resendOtp: (challengeId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('campussync_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check current session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem('campussync_token');
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const data = await apiRequest<{ user: User }>('/api/auth/me');
        if (data?.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('campussync_token');
          setToken(null);
        }
      } catch (err) {
        localStorage.removeItem('campussync_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const initiateLogin = async (email: string, password: string, selectedRole: Role): Promise<LoginChallenge> => {
    const data = await apiRequest<LoginChallenge>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, selectedRole }),
    });
    return data;
  };

  const verifyOtp = async (challengeId: string, otp: string): Promise<User> => {
    const data = await apiRequest<{ user: User; token: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp }),
    });

    localStorage.setItem('campussync_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (challengeId: string): Promise<void> => {
    await apiRequest('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('campussync_token');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        initiateLogin,
        verifyOtp,
        resendOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
