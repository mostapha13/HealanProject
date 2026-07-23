export const THEME_STORAGE_KEY = 'healan-theme';
export const NIGHT_STORAGE_KEY = 'healan-night';

export type ThemeId = 'classic' | 'warm' | 'minimal';

export const THEMES: {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
}[] = [
  {
    id: 'classic',
    label: 'لیمویی',
    swatch: ['#C6E000', '#1A1A1A', '#F4F5F7'],
  },
  {
    id: 'warm',
    label: 'گرم کلینیکی',
    swatch: ['#7f1d1d', '#c45c26', '#faf6f1'],
  },
  {
    id: 'minimal',
    label: 'مینیمال',
    swatch: ['#0f172a', '#9f1239', '#ffffff'],
  },
];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'classic' || value === 'warm' || value === 'minimal';
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'classic';
}

export function applyNight(on: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-night', on ? 'true' : 'false');
  try {
    localStorage.setItem(NIGHT_STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function readStoredNight(): boolean {
  try {
    return localStorage.getItem(NIGHT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Session-only font scale (not persisted). */
export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 1.25;
export const FONT_SCALE_STEP = 0.05;

export function applyFontScale(scale: number) {
  if (typeof document === 'undefined') return;
  const clamped = Math.min(
    FONT_SCALE_MAX,
    Math.max(FONT_SCALE_MIN, Number(scale.toFixed(2)))
  );
  document.documentElement.style.setProperty('--font-scale', String(clamped));
  return clamped;
}
