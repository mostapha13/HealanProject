/** Healan Clinic mobile — premium medical design tokens */
export const colors = {
  bg: '#F3F6F8',
  bgElevated: '#FFFFFF',
  ink: '#0F1C24',
  inkSoft: '#3D5160',
  muted: '#7A8B98',
  line: '#E2E9EF',
  primary: '#0D6E6E',
  primaryDeep: '#0A5252',
  primarySoft: '#E6F4F4',
  accent: '#C45C26',
  accentSoft: '#FBEDE6',
  success: '#1B7F5A',
  successSoft: '#E5F6EF',
  warning: '#B7791F',
  warningSoft: '#FFF6E5',
  danger: '#B42318',
  dangerSoft: '#FCE8E6',
  white: '#FFFFFF',
  overlay: 'rgba(15, 28, 36, 0.45)',
  cardShadow: 'rgba(15, 28, 36, 0.08)',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const fonts = {
  regular: 'Vazirmatn_400Regular',
  semiBold: 'Vazirmatn_600SemiBold',
  bold: 'Vazirmatn_700Bold',
};

export const typography = {
  hero: { fontSize: 30, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 38 },
  title: { fontSize: 22, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 30 },
  section: { fontSize: 17, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontFamily: fonts.regular, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontFamily: fonts.semiBold, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontFamily: fonts.regular, fontWeight: '400' as const, lineHeight: 16 },
};
