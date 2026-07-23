import { config } from '../config';
import type { TokenGetter } from './client';
import { apiGet } from './client';

export type AccessMenuTreeItem = {
  accessMenuId: number;
  accessFormId?: number;
  title?: string;
  isActive?: boolean;
  order?: number;
  parentRef?: number | null;
  accessForm?: { formTitle?: string; url?: string };
  children?: AccessMenuTreeItem[];
};

function normalizeMenuItem(raw: Record<string, unknown>): AccessMenuTreeItem {
  const accessMenuId = Number(raw['accessMenuId'] ?? raw['AccessMenuId'] ?? 0);
  const childrenRaw = (raw['children'] ?? raw['Children']) as Record<string, unknown>[] | undefined;
  const accessFormRaw = (raw['accessForm'] ?? raw['AccessForm']) as Record<string, unknown> | undefined;
  const accessForm = accessFormRaw
    ? {
        formTitle: String(accessFormRaw['formTitle'] ?? accessFormRaw['FormTitle'] ?? ''),
        url: String(accessFormRaw['url'] ?? accessFormRaw['URL'] ?? accessFormRaw['Url'] ?? ''),
      }
    : undefined;
  return {
    accessMenuId,
    accessFormId: (raw['accessFormId'] ?? raw['AccessFormId']) as number | undefined,
    title: String(raw['title'] ?? raw['Title'] ?? accessForm?.formTitle ?? '') || undefined,
    isActive: Boolean(raw['isActive'] ?? raw['IsActive'] ?? true),
    order: Number(raw['order'] ?? raw['Order'] ?? 0),
    parentRef: (raw['parentRef'] ?? raw['ParentRef']) as number | null | undefined,
    accessForm,
    children: Array.isArray(childrenRaw) ? childrenRaw.map(normalizeMenuItem) : [],
  };
}

export async function fetchMyAccessMenus(getToken: TokenGetter): Promise<AccessMenuTreeItem[]> {
  const res = await apiGet<unknown>(config.userManagerApiUrl, 'UserAccess/MyMenus', getToken, {
    AccessSystemId: config.accessSystemId,
  });
  let list: Record<string, unknown>[] = [];
  if (Array.isArray(res)) {
    list = res as Record<string, unknown>[];
  } else if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    const nested = obj['items'] ?? obj['Items'] ?? obj['menus'] ?? obj['Menus'] ?? obj['data'];
    if (Array.isArray(nested)) list = nested as Record<string, unknown>[];
  }
  return list.map(normalizeMenuItem);
}

export function flattenMenuUrls(items: AccessMenuTreeItem[]): string[] {
  const urls: string[] = [];
  const walk = (nodes: AccessMenuTreeItem[]) => {
    for (const n of nodes) {
      const url = n.accessForm?.url?.trim();
      if (url) urls.push(url);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(items);
  return urls;
}

export function canAccessPath(urls: string[], path: string): boolean {
  const normalized = (path || '').replace(/\/+$/, '') || '/';
  return urls.some((u) => {
    const nu = (u || '').replace(/\/+$/, '') || '/';
    return (
      nu === normalized ||
      normalized.startsWith(`${nu}/`) ||
      nu.startsWith(`${normalized}/`)
    );
  });
}

export function pathForModuleId(moduleId: string): string | null {
  const map: Record<string, string> = {
    dashboard: '/',
    queue: '/queue',
    appointments: '/appointments',
    patients: '/patients',
    doctors: '/doctors',
    prescriptions: '/prescriptions',
    'blood-pressure': '/blood-pressure',
    companies: '/basic-data/companies',
    insurance: '/basic-data/insurance',
    services: '/basic-data/services',
    fees: '/basic-data/fees',
    users: '/basic-data/users',
    access: '/basic-data/access',
    roles: '/basic-data/roles',
    'access-roles': '/basic-data/access-roles',
    assistant: '/basic-data/assistant',
    'booking-schedules': '/booking/schedules',
    'booking-reservations': '/booking/reservations',
    'site-content': '/site-content',
    'site-settings': '/site-content/settings',
    'site-seo': '/site-content/seo',
    'site-reviews': '/site-content/reviews',
    'site-blog': '/site-content/blog',
    'site-rag': '/site-content/rag',
    'site-rag-logs': '/site-content/rag-logs',
    reports: '/reports',
    sms: '/reports/sms',
    'sms-settings': '/reports/sms-settings',
    workflow: '/workflow',
    signature: '/signature',
  };
  return map[moduleId] ?? null;
}

/** MVP tabs the app implements — only show if AccessMenu grants the URL. */
export type MvpTab = {
  key: 'index' | 'queue' | 'appointments' | 'patients';
  title: string;
  path: string;
};

export function resolveMvpTabs(urls: string[]): MvpTab[] {
  const all: MvpTab[] = [
    { key: 'index', title: 'داشبورد', path: config.mvpPaths.dashboard },
    { key: 'queue', title: 'صف', path: config.mvpPaths.queue },
    { key: 'appointments', title: 'نوبت', path: config.mvpPaths.appointments },
    { key: 'patients', title: 'بیماران', path: config.mvpPaths.patients },
  ];
  const granted = all.filter((t) => canAccessPath(urls, t.path));
  return granted.length ? granted : [all[0]];
}
