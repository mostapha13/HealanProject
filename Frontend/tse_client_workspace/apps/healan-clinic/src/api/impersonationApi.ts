import { User, type Profile } from 'oidc-client';
import { IDENTITY_BASE_URL } from '../constants';
import { userManager } from '../store/userManager';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

const ORIGINAL_USER_KEY = 'healan.impersonation.original-user';

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

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
  sessionStorage.setItem(ORIGINAL_USER_KEY, actor.toStorageString());
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
  await userManager.storeUser(impersonated);
  setClinicBearerToken(impersonated.access_token);
}

export async function endImpersonation(): Promise<void> {
  const current = await userManager.getUser();
  const originalStorage = sessionStorage.getItem(ORIGINAL_USER_KEY);
  if (!current?.access_token || !isImpersonating(current) || !originalStorage) {
    throw new Error('نشست اصلی مدیر برای بازگشت پیدا نشد');
  }

  const response = await fetch(`${IDENTITY_BASE_URL}/api/v1/Impersonation/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${current.access_token}` },
  });
  const endAuditFailed = !response.ok;
  const original = User.fromStorageString(originalStorage);
  sessionStorage.removeItem(ORIGINAL_USER_KEY);
  await userManager.storeUser(original);
  setClinicBearerToken(original.access_token);
  if (endAuditFailed) await readError(response);
}

