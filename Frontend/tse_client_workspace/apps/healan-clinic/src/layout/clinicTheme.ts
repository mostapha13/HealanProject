export type ClinicThemeId = 'clinical' | 'navy' | 'forest' | 'slate' | 'amber';

export const CLINIC_THEMES: { id: ClinicThemeId; label: string; swatch: string }[] = [
  { id: 'clinical', label: 'کلینیکال', swatch: '#0f766e' },
  { id: 'navy', label: 'سرمه‌ای', swatch: '#1e3a5f' },
  { id: 'forest', label: 'سبز پزشکی', swatch: '#166534' },
  { id: 'slate', label: 'خاکستری', swatch: '#334155' },
  { id: 'amber', label: 'کهربایی', swatch: '#92400e' },
];

const THEME_KEY = 'healan.clinic.theme';
const DARK_KEY = 'healan.clinic.darkMode';

export function loadClinicTheme(): ClinicThemeId {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (CLINIC_THEMES.some((t) => t.id === raw)) return raw as ClinicThemeId;
  } catch {
    // ignore
  }
  return 'clinical';
}

export function saveClinicTheme(theme: ClinicThemeId): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadClinicDarkMode(): boolean {
  try {
    return localStorage.getItem(DARK_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveClinicDarkMode(dark: boolean): void {
  try {
    localStorage.setItem(DARK_KEY, dark ? '1' : '0');
  } catch {
    // ignore
  }
}
