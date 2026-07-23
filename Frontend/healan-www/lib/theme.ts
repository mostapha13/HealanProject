export const THEME_STORAGE_KEY = 'healan-theme';

export type ThemeId = 'classic' | 'warm' | 'minimal';

export const THEMES: {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
}[] = [
  {
    id: 'classic',
    label: 'کلاسیک پزشکی',
    swatch: ['#0b1f3a', '#e11d48', '#f8fafc'],
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
