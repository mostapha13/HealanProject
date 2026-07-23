import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { config } from '../config';
import { clearSession, saveSession, type StoredSession } from './session';

WebBrowser.maybeCompleteAuthSession();

export function getRedirectUri(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost:8082';
  }
  return AuthSession.makeRedirectUri({
    scheme: config.scheme,
    path: 'redirect',
  });
}

export function getDiscovery(): AuthSession.DiscoveryDocument {
  const base = config.identityUrl;
  return {
    authorizationEndpoint: `${base}/connect/authorize`,
    tokenEndpoint: `${base}/connect/token`,
    endSessionEndpoint: `${base}/connect/endsession`,
    userInfoEndpoint: `${base}/connect/userinfo`,
    revocationEndpoint: `${base}/connect/revocation`,
  };
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function networkLoginHint(): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '';
  const originPart = origin ? ` (Origin: ${origin})` : '';
  return (
    `ارتباط با سرور ورود برقرار نشد${originPart}. ` +
    `آدرس را دقیقاً http://localhost:8082 باز کنید و فقط یک نمونه Expo کلینیک اجرا باشد. ` +
    `Identity: ${config.identityUrl}`
  );
}

async function tokenRequest(body: URLSearchParams): Promise<StoredSession> {
  const url = `${config.identityUrl}/connect/token`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  } catch {
    throw new Error(networkLoginHint());
  }
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !json.access_token) {
    const msg =
      json.error_description ||
      json.error ||
      (res.status === 400 ? 'نام کاربری یا رمز عبور نادرست است' : `خطای ورود (${res.status})`);
    throw new Error(msg);
  }
  const expiresIn = json.expires_in ?? 3600;
  const session: StoredSession = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    idToken: json.id_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  await saveSession(session);
  return session;
}

/** In-app username/password login (Resource Owner Password). No Identity browser page. */
export async function loginWithPassword(username: string, password: string): Promise<StoredSession> {
  const body = new URLSearchParams();
  body.set('grant_type', 'password');
  body.set('client_id', config.clientId);
  body.set('username', username.trim());
  body.set('password', password);
  // Match clinic web API access: Content_Producer (+ offline refresh).
  body.set('scope', 'openid profile Content_Producer offline_access');
  return tokenRequest(body);
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<StoredSession> {
  const redirectUri = getRedirectUri();
  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: config.clientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    getDiscovery()
  );

  const expiresIn = token.expiresIn ?? 3600;
  const session: StoredSession = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    idToken: token.idToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  await saveSession(session);
  return session;
}

export async function refreshAccessToken(refreshToken: string): Promise<StoredSession> {
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('client_id', config.clientId);
  body.set('refresh_token', refreshToken);
  try {
    return await tokenRequest(body);
  } catch {
    // fallback to expo helper
    const token = await AuthSession.refreshAsync(
      {
        clientId: config.clientId,
        refreshToken,
      },
      getDiscovery()
    );
    const expiresIn = token.expiresIn ?? 3600;
    const session: StoredSession = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken ?? refreshToken,
      idToken: token.idToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    await saveSession(session);
    return session;
  }
}

export async function endRemoteSession(idToken?: string): Promise<void> {
  await clearSession();
  // Password login has no browser SSO session to clear; skip endsession redirect on purpose.
  void idToken;
}
