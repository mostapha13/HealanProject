import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'healan.access_token';
const REFRESH = 'healan.refresh_token';
const EXPIRES = 'healan.expires_at';
const ID_TOKEN = 'healan.id_token';

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** epoch ms */
  expiresAt: number;
};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // fall through
    }
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
      return;
    } catch {
      return;
    }
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

export async function saveSession(session: StoredSession): Promise<void> {
  await setItem(ACCESS, session.accessToken);
  await setItem(EXPIRES, String(session.expiresAt));
  if (session.refreshToken) {
    await setItem(REFRESH, session.refreshToken);
  } else {
    await deleteItem(REFRESH);
  }
  if (session.idToken) {
    await setItem(ID_TOKEN, session.idToken);
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const accessToken = await getItem(ACCESS);
  const expiresRaw = await getItem(EXPIRES);
  if (!accessToken || !expiresRaw) return null;
  return {
    accessToken,
    expiresAt: Number(expiresRaw) || 0,
    refreshToken: (await getItem(REFRESH)) ?? undefined,
    idToken: (await getItem(ID_TOKEN)) ?? undefined,
  };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteItem(ACCESS),
    deleteItem(REFRESH),
    deleteItem(EXPIRES),
    deleteItem(ID_TOKEN),
  ]);
}

export function isSessionExpired(session: StoredSession, skewMs = 60_000): boolean {
  return !session.accessToken || Date.now() >= session.expiresAt - skewMs;
}
