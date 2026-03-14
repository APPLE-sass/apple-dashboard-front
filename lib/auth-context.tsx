'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, getAccessToken, clearTokens } from './api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nombre: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 <= Date.now()) return null;
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      nombre: payload.nombre,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
      } else {
        clearTokens();
      }
    }
    // Always mark loading done after token check
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    // Handle both { user: {...} } and flat payload with user fields
    const userData: User = response.user ?? {
      id: (response as unknown as { id?: string; sub?: string }).sub ?? (response as unknown as { id?: string }).id ?? '',
      email: (response as unknown as { email?: string }).email ?? email,
      nombre: (response as unknown as { nombre?: string }).nombre ?? '',
      role: (response as unknown as { role?: string }).role,
    };
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, nombre: string, password: string) => {
    const response = await authApi.register(email, nombre, password);
    const userData: User = response.user ?? {
      id: (response as unknown as { id?: string; sub?: string }).sub ?? (response as unknown as { id?: string }).id ?? '',
      email: (response as unknown as { email?: string }).email ?? email,
      nombre,
      role: (response as unknown as { role?: string }).role,
    };
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
