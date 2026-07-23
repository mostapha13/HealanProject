import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  bookingOtpRequest,
  bookingOtpVerify,
  bookingProfileStatus,
} from '../api/portal';
import {
  clearSession,
  isSessionExpired,
  loadSession,
  saveSession,
  sessionFromAuth,
  type PatientSession,
} from './session';

type AuthContextValue = {
  loading: boolean;
  session: PatientSession | null;
  lastError: string | null;
  requestOtp: (phone: string) => Promise<{ phoneMasked?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PatientSession | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await loadSession();
        if (!stored || isSessionExpired(stored)) {
          await clearSession();
          setSession(null);
          return;
        }
        setSession(stored);
        try {
          const profile = await bookingProfileStatus(stored.accessToken);
          const next = { ...stored, ...sessionFromAuth({ ...profile, accessToken: profile.accessToken || stored.accessToken }) };
          setSession(next);
          await saveSession(next);
        } catch {
          /* keep stored session */
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    setLastError(null);
    const res = await bookingOtpRequest(phone);
    return { phoneMasked: res.phoneMasked };
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    setLastError(null);
    setLoading(true);
    try {
      const result = await bookingOtpVerify(phone, code);
      if (!result.accessToken) throw new Error('ورود ناموفق بود');
      const next = sessionFromAuth(result);
      await saveSession(next);
      setSession(next);
    } catch (err) {
      setSession(null);
      const msg = err instanceof Error ? err.message : 'کد تأیید نامعتبر است';
      setLastError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.accessToken) return;
    const profile = await bookingProfileStatus(session.accessToken);
    const next = {
      ...session,
      ...sessionFromAuth({ ...profile, accessToken: profile.accessToken || session.accessToken }),
    };
    setSession(next);
    await saveSession(next);
  }, [session]);

  const signOut = useCallback(async () => {
    setSession(null);
    await clearSession();
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!session || isSessionExpired(session)) return null;
    return session.accessToken;
  }, [session]);

  const value = useMemo(
    () => ({
      loading,
      session,
      lastError,
      requestOtp,
      verifyOtp,
      refreshProfile,
      signOut,
      getAccessToken,
    }),
    [loading, session, lastError, requestOtp, verifyOtp, refreshProfile, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
