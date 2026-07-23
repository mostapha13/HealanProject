import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { config } from '../config';
import { clearSession, saveSession, type StoredSession } from './session';

WebBrowser.maybeCompleteAuthSession();

export function getRedirectUri(): string {
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

export async function endRemoteSession(idToken?: string): Promise<void> {
  const discovery = getDiscovery();
  if (discovery.endSessionEndpoint && idToken) {
    const url = `${discovery.endSessionEndpoint}?id_token_hint=${encodeURIComponent(idToken)}&post_logout_redirect_uri=${encodeURIComponent(getRedirectUri())}`;
    try {
      await WebBrowser.openAuthSessionAsync(url, getRedirectUri());
    } catch {
      // ignore — local clear still happens
    }
  }
  await clearSession();
}
