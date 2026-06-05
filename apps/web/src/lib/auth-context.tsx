'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthResponse, AuthUser } from '@plal/shared';
import { api, setToken, getToken, clearTokens, setRefreshToken, onTokenExpired } from './api';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  city?: string;
  country?: string;
  inviteToken?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleAuthExpired = useCallback(() => {
    clearTokens();
    setUser(null);
    // Ne pas rediriger si déjà sur login
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [router]);

  // Enregistrer le callback de session expirée
  useEffect(() => {
    onTokenExpired(handleAuthExpired);
  }, [handleAuthExpired]);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse & { refreshToken?: string }>('/auth/login', { email, password }, false);
    setToken(res.accessToken);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<AuthResponse & { refreshToken?: string }>('/auth/register', input, false);
    setToken(res.accessToken);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
