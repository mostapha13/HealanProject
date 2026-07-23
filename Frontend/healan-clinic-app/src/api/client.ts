import { config } from '../config';
import { useAuth } from '../auth/AuthContext';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? formatApiFailure(status, body));
    this.status = status;
    this.body = body;
  }
}

/** Prefer server Persian message over bare "HTTP 400". */
function formatApiFailure(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    const errors = o.Errors ?? o.errors;
    if (Array.isArray(errors)) {
      const usable = errors.find(
        (e) => typeof e === 'string' && e.trim() && !e.startsWith('diag:')
      );
      if (typeof usable === 'string') return usable;
    }
    const title = o.Title ?? o.title ?? o.detail ?? o.Detail;
    if (typeof title === 'string' && title.trim()) return title;
  }
  if (status === 401) return 'نشست منقضی شده. دوباره وارد شوید.';
  if (status === 403) return 'دسترسی به این بخش ندارید.';
  if (status === 456) return 'حساب کاربری غیرفعال است.';
  return `HTTP ${status}`;
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

/** Max pageSize allowed by Share.Application PaginatedList (server returns 400 above this). */
export const HEALAN_MAX_PAGE_SIZE = 20;

export function clampPageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) return HEALAN_MAX_PAGE_SIZE;
  return Math.min(pageSize, HEALAN_MAX_PAGE_SIZE);
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    // Server rejects pageSize > 20 with HTTP 400.
    if (k === 'pageSize') {
      qs.set(k, String(clampPageSize(Number(v))));
      continue;
    }
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

export type PaginatedPage<T> = {
  items?: T[];
  Items?: T[];
  totalCount?: number;
  TotalCount?: number;
  hasNextPage?: boolean;
  HasNextPage?: boolean;
  pageNumber?: number;
  PageNumber?: number;
};

export function pageItems<T>(page: PaginatedPage<T> | T[] | null | undefined): T[] {
  if (!page) return [];
  if (Array.isArray(page)) return page;
  return page.items ?? page.Items ?? [];
}

export function pageHasNext(page: PaginatedPage<unknown> | null | undefined): boolean {
  if (!page || Array.isArray(page)) return false;
  if (typeof page.hasNextPage === 'boolean') return page.hasNextPage;
  if (typeof page.HasNextPage === 'boolean') return page.HasNextPage;
  const total = page.totalCount ?? page.TotalCount;
  const pageNumber = page.pageNumber ?? page.PageNumber ?? 1;
  if (typeof total === 'number') {
    return pageNumber * HEALAN_MAX_PAGE_SIZE < total;
  }
  return pageItems(page).length >= HEALAN_MAX_PAGE_SIZE;
}

/** Load all pages (API max pageSize=20). */
export async function fetchAllPaginated<T>(
  fetchPage: (pageNumber: number, pageSize: number) => Promise<PaginatedPage<T> | T[]>,
  maxPages = 50
): Promise<T[]> {
  const all: T[] = [];
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await fetchPage(pageNumber, HEALAN_MAX_PAGE_SIZE);
    const items = pageItems(page);
    all.push(...items);
    if (Array.isArray(page) || !pageHasNext(page) || items.length === 0) break;
  }
  return all;
}

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
