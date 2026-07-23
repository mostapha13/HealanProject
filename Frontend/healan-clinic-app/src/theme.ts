/** Healan Clinic mobile — bank-app inspired premium tokens */
export const colors = {
  bg: '#F4F5F7',
  bgElevated: '#FFFFFF',
  ink: '#1A1A1A',
  inkSoft: '#4A4A4A',
  muted: '#8A8A8A',
  line: '#E8E8EA',
  /** Lime brand (QBank-like) */
  primary: '#C6E000',
  primaryDeep: '#A8C200',
  primaryInk: '#1A1A1A',
  primarySoft: '#F4FAC8',
  accent: '#1A1A1A',
  accentSoft: '#F0F0F0',
  success: '#1B7F5A',
  successSoft: '#E5F6EF',
  warning: '#B7791F',
  warningSoft: '#FFF6E5',
  danger: '#B42318',
  dangerSoft: '#FCE8E6',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.35)',
  cardShadow: 'rgba(0, 0, 0, 0.06)',
  tabInactive: '#9A9A9A',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const fonts = {
  regular: 'Vazirmatn_400Regular',
  semiBold: 'Vazirmatn_600SemiBold',
  bold: 'Vazirmatn_700Bold',
};

export const typography = {
  hero: { fontSize: 28, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 36 },
  title: { fontSize: 20, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 28 },
  section: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 14, fontFamily: fonts.regular, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontFamily: fonts.regular, fontWeight: '400' as const, lineHeight: 16 },
};
