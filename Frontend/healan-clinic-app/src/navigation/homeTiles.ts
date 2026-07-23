import type { ClinicModule, ClinicModuleId, IconName } from './catalog';

export type HomeTileDef = {
  id: ClinicModuleId;
  path: string;
  title: string;
  icon: IconName;
};

/** Fixed small cards on home (3×2) — shown only if AccessMenu grants the path. */
export const HOME_SMALL_TILES: HomeTileDef[] = [
  { id: 'queue', path: '/queue', title: 'صف انتظار', icon: 'people-outline' },
  { id: 'appointments', path: '/appointments', title: 'پذیرش و نوبت', icon: 'calendar-outline' },
  { id: 'booking-reservations', path: '/booking/reservations', title: 'رزروهای نوبت', icon: 'bookmark-outline' },
  { id: 'patients', path: '/patients', title: 'بیماران', icon: 'person-outline' },
  { id: 'blood-pressure', path: '/blood-pressure', title: 'فشار خون', icon: 'heart-outline' },
  { id: 'doctors', path: '/doctors', title: 'پزشکان', icon: 'medkit-outline' },
];

/** Fixed large cards on home (2×2). */
export const HOME_LARGE_TILES: HomeTileDef[] = [
  { id: 'site-reviews', path: '/site-content/reviews', title: 'نظرات بیمار', icon: 'chatbubbles-outline' },
  { id: 'site-blog', path: '/site-content/blog', title: 'بلاگ', icon: 'newspaper-outline' },
  { id: 'reports', path: '/reports', title: 'نمودارها و آمارها', icon: 'bar-chart-outline' },
  { id: 'site-rag', path: '/site-content/rag', title: 'دانش پایه ربات', icon: 'hardware-chip-outline' },
];

export function filterAccessibleTiles(
  defs: HomeTileDef[],
  accessible: ClinicModule[],
  grantedUrls: string[] = []
): HomeTileDef[] {
  const ids = new Set(accessible.map((m) => m.id));
  const paths = new Set(accessible.map((m) => m.path));
  const urlHit = (path: string) => {
    const normalized = path.replace(/\/+$/, '') || '/';
    return grantedUrls.some((u) => {
      const nu = (u || '').replace(/\/+$/, '') || '/';
      return nu === normalized || nu.startsWith(`${normalized}/`);
    });
  };
  const filtered = defs.filter(
    (d) => ids.has(d.id) || paths.has(d.path) || urlHit(d.path)
  );
  // Empty AccessMenu = no tiles (never show unauthorized modules).
  return filtered;
}
