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

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, session.accessToken);
  await SecureStore.setItemAsync(EXPIRES, String(session.expiresAt));
  if (session.refreshToken) {
    await SecureStore.setItemAsync(REFRESH, session.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH).catch(() => undefined);
  }
  if (session.idToken) {
    await SecureStore.setItemAsync(ID_TOKEN, session.idToken);
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS);
  const expiresRaw = await SecureStore.getItemAsync(EXPIRES);
  if (!accessToken || !expiresRaw) return null;
  return {
    accessToken,
    expiresAt: Number(expiresRaw) || 0,
    refreshToken: (await SecureStore.getItemAsync(REFRESH)) ?? undefined,
    idToken: (await SecureStore.getItemAsync(ID_TOKEN)) ?? undefined,
  };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS).catch(() => undefined),
    SecureStore.deleteItemAsync(REFRESH).catch(() => undefined),
    SecureStore.deleteItemAsync(EXPIRES).catch(() => undefined),
    SecureStore.deleteItemAsync(ID_TOKEN).catch(() => undefined),
  ]);
}

export function isSessionExpired(session: StoredSession, skewMs = 60_000): boolean {
  return !session.accessToken || Date.now() >= session.expiresAt - skewMs;
}
