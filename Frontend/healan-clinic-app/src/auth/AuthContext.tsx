import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
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

const PKCE_STORAGE_KEY = 'healan_clinic_oidc_pkce';

type PendingPkce = {
  codeVerifier: string;
  state?: string;
  redirectUri: string;
};

type AuthContextValue = {
  loading: boolean;
  session: StoredSession | null;
  lastError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readOauthQuery(): { code?: string; state?: string; error?: string; errorDescription?: string } {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  return {
    code: q.get('code') ?? undefined,
    state: q.get('state') ?? undefined,
    error: q.get('error') ?? undefined,
    errorDescription: q.get('error_description') ?? undefined,
  };
}

function clearOauthQueryFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['code', 'state', 'session_state', 'iss', 'error', 'error_description'].forEach((k) =>
    url.searchParams.delete(k)
  );
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, next || '/');
}

function savePendingPkce(value: PendingPkce) {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(value));
}

function loadPendingPkce(): PendingPkce | null {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPkce;
  } catch {
    return null;
  }
}

function clearPendingPkce() {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const exchangingRef = useRef(false);

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

  const completeWithCode = useCallback(async (code: string, codeVerifier: string) => {
    if (exchangingRef.current) return;
    exchangingRef.current = true;
    setLoading(true);
    setLastError(null);
    try {
      const next = await exchangeCodeForTokens(code, codeVerifier);
      setSession(next);
      clearPendingPkce();
      clearOauthQueryFromUrl();
    } catch (err) {
      console.warn('OIDC token exchange failed', err);
      setSession(null);
      setLastError(err instanceof Error ? err.message : 'تبادل توکن ناموفق بود');
      clearPendingPkce();
      clearOauthQueryFromUrl();
    } finally {
      exchangingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Boot: restore session OR finish web OAuth redirect (?code=...)
  useEffect(() => {
    void (async () => {
      try {
        const oauth = readOauthQuery();
        if (oauth.error) {
          setLastError(oauth.errorDescription || oauth.error);
          clearOauthQueryFromUrl();
          clearPendingPkce();
          setSession(null);
          return;
        }

        if (oauth.code) {
          const pending = loadPendingPkce();
          const verifier = pending?.codeVerifier;
          if (!verifier) {
            setLastError('نشست ورود منقضی شد. دوباره «ورود امن» را بزنید.');
            clearOauthQueryFromUrl();
            return;
          }
          await completeWithCode(oauth.code, verifier);
          return;
        }

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
  }, [completeWithCode]);

  // Native / popup path: AuthSession response
  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type === 'error') {
        setLastError(response.error?.message ?? 'ورود لغو یا ناموفق بود');
      }
      return;
    }
    const code = response.params.code;
    const verifier = request?.codeVerifier ?? loadPendingPkce()?.codeVerifier;
    if (!code || !verifier) return;
    void completeWithCode(code, verifier);
  }, [response, request, completeWithCode]);

  const signIn = useCallback(async () => {
    if (!request) throw new Error('درخواست ورود هنوز آماده نیست');
    setLastError(null);
    if (request.codeVerifier) {
      savePendingPkce({
        codeVerifier: request.codeVerifier,
        state: request.state,
        redirectUri,
      });
    }
    // Web: full-page redirect back to origin; PKCE verifier is in sessionStorage.
    await promptAsync({ showInRecents: true });
  }, [request, promptAsync, redirectUri]);

  const signOut = useCallback(async () => {
    const idToken = session?.idToken;
    setSession(null);
    clearPendingPkce();
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

/** True while browser URL still has OAuth callback params. */
export function hasOauthCallbackParams(): boolean {
  const q = readOauthQuery();
  return Boolean(q.code || q.error);
}
