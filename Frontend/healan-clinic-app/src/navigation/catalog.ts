import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { AccessMenuTreeItem } from '../api/access';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type ClinicModuleId =
  | 'dashboard'
  | 'queue'
  | 'appointments'
  | 'patients'
  | 'doctors'
  | 'prescriptions'
  | 'blood-pressure'
  | 'companies'
  | 'insurance'
  | 'services'
  | 'fees'
  | 'users'
  | 'access'
  | 'roles'
  | 'access-roles'
  | 'assistant'
  | 'booking-schedules'
  | 'booking-reservations'
  | 'site-content'
  | 'site-settings'
  | 'site-seo'
  | 'site-reviews'
  | 'site-blog'
  | 'site-rag'
  | 'site-rag-logs'
  | 'reports'
  | 'sms'
  | 'sms-settings'
  | 'workflow'
  | 'signature'
  | 'generic';

export type ClinicModule = {
  id: ClinicModuleId;
  title: string;
  path: string;
  icon: IconName;
  kind: 'native' | 'folder';
};

const PATH_MAP: { match: RegExp | string; id: ClinicModuleId; icon: IconName }[] = [
  { match: /^\/?$/, id: 'dashboard', icon: 'grid-outline' },
  { match: '/queue', id: 'queue', icon: 'people-outline' },
  { match: '/appointments', id: 'appointments', icon: 'calendar-outline' },
  { match: '/patients', id: 'patients', icon: 'person-outline' },
  { match: '/doctors', id: 'doctors', icon: 'medkit-outline' },
  { match: '/prescriptions', id: 'prescriptions', icon: 'document-text-outline' },
  { match: '/blood-pressure', id: 'blood-pressure', icon: 'heart-outline' },
  { match: '/basic-data/companies', id: 'companies', icon: 'business-outline' },
  { match: '/basic-data/insurance', id: 'insurance', icon: 'shield-checkmark-outline' },
  { match: '/basic-data/services', id: 'services', icon: 'apps-outline' },
  { match: '/basic-data/fees', id: 'fees', icon: 'pricetag-outline' },
  { match: '/basic-data/users', id: 'users', icon: 'people-circle-outline' },
  { match: '/basic-data/access-roles', id: 'access-roles', icon: 'key-outline' },
  { match: '/basic-data/access-admin', id: 'roles', icon: 'ribbon-outline' },
  { match: '/basic-data/roles', id: 'roles', icon: 'ribbon-outline' },
  { match: '/basic-data/access', id: 'access', icon: 'lock-closed-outline' },
  { match: '/basic-data/assistant', id: 'assistant', icon: 'sparkles-outline' },
  { match: '/booking/schedules', id: 'booking-schedules', icon: 'time-outline' },
  { match: '/booking/reservations', id: 'booking-reservations', icon: 'bookmark-outline' },
  { match: '/site-content/settings', id: 'site-settings', icon: 'settings-outline' },
  { match: '/site-content/seo', id: 'site-seo', icon: 'search-outline' },
  { match: '/site-content/reviews', id: 'site-reviews', icon: 'chatbubbles-outline' },
  { match: '/site-content/blog', id: 'site-blog', icon: 'newspaper-outline' },
  { match: '/site-content/rag-logs', id: 'site-rag-logs', icon: 'list-outline' },
  { match: '/site-content/rag', id: 'site-rag', icon: 'hardware-chip-outline' },
  { match: '/site-content', id: 'site-content', icon: 'globe-outline' },
  { match: '/reports/sms-settings', id: 'sms-settings', icon: 'construct-outline' },
  { match: '/reports/sms', id: 'sms', icon: 'chatbox-ellipses-outline' },
  { match: '/reports', id: 'reports', icon: 'bar-chart-outline' },
  { match: '/workflow', id: 'workflow', icon: 'git-branch-outline' },
  { match: '/signature', id: 'signature', icon: 'create-outline' },
];

function normalizePath(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '');
}

export function resolveModuleFromPath(path?: string, title?: string): ClinicModule {
  const p = normalizePath(path);
  for (const row of PATH_MAP) {
    if (typeof row.match === 'string') {
      if (p === row.match || p.startsWith(`${row.match}/`)) {
        return {
          id: row.id,
          title: title || row.id,
          path: p || row.match,
          icon: row.icon,
          kind: 'native',
        };
      }
    } else if (row.match.test(p)) {
      return {
        id: row.id,
        title: title || row.id,
        path: p || '/',
        icon: row.icon,
        kind: 'native',
      };
    }
  }
  return {
    id: 'generic',
    title: title || p || 'بخش',
    path: p || '/',
    icon: 'ellipse-outline',
    kind: 'native',
  };
}

export type HomeSection = {
  key: string;
  title: string;
  items: ClinicModule[];
};

function menuTitle(item: AccessMenuTreeItem): string {
  return item.title || item.accessForm?.formTitle || `منو ${item.accessMenuId}`;
}

/** Flatten AccessMenu tree into home sections (folders) + leaf modules. Skip action-only URLs. */
export function buildHomeSections(tree: AccessMenuTreeItem[]): HomeSection[] {
  const ACTION_RE = /\/(add|edit|delete|publish)$/i;
  const sections: HomeSection[] = [];

  const pushLeaf = (bucket: ClinicModule[], item: AccessMenuTreeItem) => {
    const url = item.accessForm?.url;
    if (!url || ACTION_RE.test(url)) return;
    // patient portal / public site routes stay out of clinic mobile hub
    if (url.startsWith('/patient') || url === '/assistant' || url === '/booking') return;
    bucket.push(resolveModuleFromPath(url, menuTitle(item)));
  };

  const walkFolder = (item: AccessMenuTreeItem): ClinicModule[] => {
    const leaves: ClinicModule[] = [];
    for (const child of item.children ?? []) {
      if (child.children?.length && !child.accessForm?.url) {
        leaves.push(...walkFolder(child));
      } else if (child.accessForm?.url) {
        pushLeaf(leaves, child);
      } else if (child.children?.length) {
        leaves.push(...walkFolder(child));
      }
    }
    return leaves;
  };

  // Top-level dashboard leaf
  for (const root of tree) {
    const url = root.accessForm?.url;
    if (url && !root.children?.length) {
      if (normalizePath(url) === '/') {
        sections.unshift({
          key: 'dashboard',
          title: 'خانه',
          items: [resolveModuleFromPath('/', menuTitle(root))],
        });
      } else {
        pushLeaf(
          (sections.find((s) => s.key === 'other') ??
            (() => {
              const s = { key: 'other', title: 'سایر', items: [] as ClinicModule[] };
              sections.push(s);
              return s;
            })()
          ).items,
          root
        );
      }
      continue;
    }

    if (root.children?.length) {
      const items = walkFolder(root);
      if (items.length) {
        sections.push({
          key: String(root.accessMenuId),
          title: menuTitle(root),
          items,
        });
      }
    }
  }

  // Deduplicate by path within each section
  return sections.map((section) => {
    const seen = new Set<string>();
    return {
      ...section,
      items: section.items.filter((item) => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      }),
    };
  });
}

export function iconForModule(id: ClinicModuleId): IconName {
  return PATH_MAP.find((p) => p.id === id)?.icon ?? 'ellipse-outline';
}

/** Flatten all leaf modules from AccessMenu (deduped by path). */
export function flattenModules(tree: AccessMenuTreeItem[]): ClinicModule[] {
  const sections = buildHomeSections(tree);
  const seen = new Set<string>();
  const all: ClinicModule[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.id === 'dashboard') continue;
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      all.push(item);
    }
  }
  return all;
}

/** Priority for home icon grid + feature cards (clinic ops first). */
const HOME_PRIORITY: ClinicModuleId[] = [
  'queue',
  'appointments',
  'patients',
  'doctors',
  'prescriptions',
  'blood-pressure',
  'booking-reservations',
  'booking-schedules',
  'sms',
  'reports',
  'signature',
  'workflow',
  'services',
  'fees',
  'insurance',
  'companies',
  'users',
  'site-content',
  'site-blog',
  'site-reviews',
  'assistant',
  'site-rag',
];

function sortByPriority(items: ClinicModule[]): ClinicModule[] {
  return [...items].sort((a, b) => {
    const ia = HOME_PRIORITY.indexOf(a.id);
    const ib = HOME_PRIORITY.indexOf(b.id);
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    return sa - sb;
  });
}

export type MobileHomeLayout = {
  /** 4-column quick actions (capped) */
  quickActions: ClinicModule[];
  /** 2-column feature cards (capped) */
  featureCards: ClinicModule[];
  /** Remaining menus for «خدمات» tab */
  allServices: ClinicModule[];
};

/**
 * Bank-app style home layout from AccessMenu API.
 * Caps home density; full list stays available in services tab.
 */
export function buildMobileHomeLayout(tree: AccessMenuTreeItem[]): MobileHomeLayout {
  const all = sortByPriority(flattenModules(tree));
  const quickActions = all.slice(0, 8);
  const featureIds = new Set(quickActions.slice(0, 4).map((x) => x.path));
  // Prefer distinct high-priority cards not already filling the first row of icons conceptually —
  // use next priority items for larger cards (ops focus).
  const featurePool = all.filter((m) =>
    ['queue', 'appointments', 'prescriptions', 'signature', 'patients', 'reports', 'booking-reservations', 'workflow'].includes(
      m.id
    )
  );
  const featureCards = (featurePool.length ? featurePool : all).slice(0, 4);
  // If still empty, fall back
  const cards = featureCards.length ? featureCards : all.slice(0, 4);
  void featureIds;
  return {
    quickActions,
    featureCards: cards,
    allServices: all,
  };
}
