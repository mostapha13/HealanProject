import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearSession,
  isSessionExpired,
  loadSession,
  type StoredSession,
} from './session';
import { endRemoteSession, loginWithPassword, refreshAccessToken } from './oidc';

type AuthContextValue = {
  loading: boolean;
  session: StoredSession | null;
  lastError: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await loadSession();
        if (!stored) {
          setSession(null);
          return;
        }
        if (!isSessionExpired(stored)) {
          setSession(stored);
          return;
        }
        if (stored.refreshToken) {
          const refreshed = await refreshAccessToken(stored.refreshToken);
          setSession(refreshed);
          return;
        }
        await clearSession();
        setSession(null);
      } catch {
        await clearSession();
        setSession(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setLastError(null);
    setLoading(true);
    try {
      const next = await loginWithPassword(username, password);
      setSession(next);
    } catch (err) {
      setSession(null);
      const msg = err instanceof Error ? err.message : 'ورود ناموفق بود';
      setLastError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const idToken = session?.idToken;
    setSession(null);
    await endRemoteSession(idToken);
  }, [session?.idToken]);

  const getAccessToken = useCallback(async () => {
    let current = session ?? (await loadSession());
    if (!current) return null;
    if (isSessionExpired(current)) {
      if (!current.refreshToken) {
        await clearSession();
        setSession(null);
        return null;
      }
      try {
        current = await refreshAccessToken(current.refreshToken);
        setSession(current);
      } catch {
        await clearSession();
        setSession(null);
        return null;
      }
    }
    return current.accessToken;
  }, [session]);

  const value = useMemo(
    () => ({ loading, session, lastError, signIn, signOut, getAccessToken }),
    [loading, session, lastError, signIn, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasOauthCallbackParams(): boolean {
  return false;
}
