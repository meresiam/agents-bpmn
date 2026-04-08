'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { clearSession, readSession, writeSession } from '@/lib/internal-auth';

type AuthContextValue = {
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthShell');
  }
  return ctx;
}

export function AuthShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(readSession());
    setReady(true);
  }, []);

  const loginSuccess = useCallback(() => {
    writeSession();
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setAuthenticated(false);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-zinc-100" aria-hidden />;
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={loginSuccess} />;
  }

  return (
    <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
  );
}
