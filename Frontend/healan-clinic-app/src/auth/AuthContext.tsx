import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as AuthSession from 'expo-auth-session';
import { config } from '../config';
import {
  clearSession,
  isSessionExpired,
  loadSession,
  type StoredSession,
} from './session';
import {
  endRemoteSession,
  exchangeCodeForTokens,
  getDiscovery,
  getRedirectUri,
  refreshAccessToken,
} from './oidc';

type AuthContextValue = {
  loading: boolean;
  session: StoredSession | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);

  const discovery = useMemo(() => getDiscovery(), []);
  const redirectUri = useMemo(() => getRedirectUri(), []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes: config.scopes,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

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

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success' || !request?.codeVerifier) return;
    const code = response.params.code;
    if (!code) return;
    void (async () => {
      setLoading(true);
      try {
        const next = await exchangeCodeForTokens(code, request.codeVerifier!);
        setSession(next);
      } catch (err) {
        console.warn('OIDC token exchange failed', err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [response, request]);

  const signIn = useCallback(async () => {
    if (!request) throw new Error('درخواست ورود هنوز آماده نیست');
    await promptAsync({ showInRecents: true });
  }, [request, promptAsync]);

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
    () => ({ loading, session, signIn, signOut, getAccessToken }),
    [loading, session, signIn, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
