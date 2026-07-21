import { User, type Profile } from 'oidc-client';
import { IDENTITY_BASE_URL } from '../constants';
import { environment } from '../environments/environment';
import { userManager } from '../store/userManager';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

const PORTAL_TOKEN_KEY = 'portal_rag_access_token';

function decodeProfile(token: string): Profile {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('توکن ورود به‌جای کاربر معتبر نیست');
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
  return JSON.parse(decodeURIComponent(escape(window.atob(base64)))) as Profile;
}

async function readError(response: Response): Promise<never> {
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  throw {
    status: response.status,
    data: {
      message: data.error_description || data.error || 'ورود به‌جای کاربر انجام نشد',
    },
  };
}

export function isImpersonating(user: User | null | undefined): boolean {
  return String(user?.profile?.['impersonation']).toLowerCase() === 'true';
}

export function getPortalHomeUrl(): string {
  return (environment as { portalUrl?: string }).portalUrl || 'https://www.drshahrooei.ir';
}

/** Share bearer with portal pages opened from clinic nav (same key as portal OTP session). */
export function syncPortalAccessToken(accessToken?: string): void {
  try {
    if (accessToken) localStorage.setItem(PORTAL_TOKEN_KEY, accessToken);
    else localStorage.removeItem(PORTAL_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Start impersonation: discard the admin OIDC session completely.
 * Browser back cannot restore the admin token because it is never kept.
 */
export async function startImpersonation(targetUserId: string): Promise<void> {
  const actor = await userManager.getUser();
  if (!actor?.access_token || actor.expired) throw new Error('نشست مدیر منقضی شده است');
  if (isImpersonating(actor)) throw new Error('ورود زنجیره‌ای به‌جای کاربر مجاز نیست');

  const body = new URLSearchParams({
    client_id: 'HealanImpersonationClient',
    grant_type: 'healan_impersonation',
    actor_token: actor.access_token,
    target_user_id: targetUserId,
    scope: 'Content_Producer',
  });
  const response = await fetch(`${IDENTITY_BASE_URL}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) return readError(response);

  const token = (await response.json()) as TokenResponse;
  const impersonated = new User({
    id_token: '',
    session_state: '',
    access_token: token.access_token,
    refresh_token: '',
    token_type: token.token_type ?? 'Bearer',
    scope: token.scope ?? 'Content_Producer',
    profile: decodeProfile(token.access_token),
    expires_at: Math.floor(Date.now() / 1000) + Number(token.expires_in || 300),
    state: null,
  });

  // Drop admin session first so history/back cannot revive it.
  await userManager.removeUser();
  await userManager.storeUser(impersonated);
  setClinicBearerToken(impersonated.access_token);
  syncPortalAccessToken(impersonated.access_token);
}

/** Best-effort audit end; does not restore admin. */
export async function auditEndImpersonation(): Promise<void> {
  const current = await userManager.getUser();
  if (!current?.access_token || !isImpersonating(current)) return;
  try {
    await fetch(`${IDENTITY_BASE_URL}/api/v1/Impersonation/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${current.access_token}` },
    });
  } catch {
    // ignore — logout must continue
  }
}

/** Full logout to the public site home (works for normal and impersonated sessions). */
export async function logoutToPortalHome(): Promise<void> {
  await auditEndImpersonation();
  syncPortalAccessToken(undefined);
  setClinicBearerToken('');
  const home = getPortalHomeUrl();
  try {
    await userManager.signoutRedirect({
      post_logout_redirect_uri: home,
    } as Parameters<typeof userManager.signoutRedirect>[0]);
  } catch {
    await userManager.removeUser().catch(() => undefined);
    window.location.assign(home);
  }
}
