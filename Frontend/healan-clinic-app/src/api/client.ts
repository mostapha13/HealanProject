import { config } from '../config';
import { useAuth } from '../auth/AuthContext';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/** Unwrap common ASP.NET / MediatR envelopes. */
function unwrap<T>(json: unknown): T {
  if (json == null) return json as T;
  if (typeof json !== 'object') return json as T;
  const obj = json as Record<string, unknown>;
  if ('data' in obj && obj['data'] !== undefined) return obj['data'] as T;
  if ('result' in obj && obj['result'] !== undefined) return obj['result'] as T;
  if ('value' in obj && obj['value'] !== undefined) return obj['value'] as T;
  return json as T;
}

export type TokenGetter = () => Promise<string | null>;

export async function apiGet<T>(
  baseUrl: string,
  path: string,
  getToken: TokenGetter,
  params?: Record<string, unknown>
): Promise<T> {
  const token = await getToken();
  const res = await fetch(joinUrl(baseUrl, path) + toQuery(params), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new ApiError(res.status, body);
  return unwrap<T>(body);
}

export async function apiPost<T>(
  baseUrl: string,
  path: string,
  getToken: TokenGetter,
  data?: unknown
): Promise<T> {
  const token = await getToken();
  const res = await fetch(joinUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new ApiError(res.status, body);
  return unwrap<T>(body);
}

export function useApiClient() {
  const { getAccessToken } = useAuth();
  return {
    healanGet: <T,>(path: string, params?: Record<string, unknown>) =>
      apiGet<T>(config.healanApiUrl, path, getAccessToken, params),
    healanPost: <T,>(path: string, data?: unknown) =>
      apiPost<T>(config.healanApiUrl, path, getAccessToken, data),
    userManagerGet: <T,>(path: string, params?: Record<string, unknown>) =>
      apiGet<T>(config.userManagerApiUrl, path, getAccessToken, params),
  };
}
