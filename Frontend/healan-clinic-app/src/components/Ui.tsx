import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme';

export function AppScreen({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.screen, padded && styles.padded, style]}>{children}</View>;
}

export function HeroHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <LinearGradient colors={[colors.primaryDeep, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>Healan Clinic</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

export function SurfaceCard({
  children,
  onPress,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
}) {
  const toneStyle =
    tone === 'primary'
      ? styles.cardPrimary
      : tone === 'accent'
        ? styles.cardAccent
        : tone === 'success'
          ? styles.cardSuccess
          : tone === 'warning'
            ? styles.cardWarning
            : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, toneStyle, pressed && styles.cardPressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function StatTile({
  label,
  value,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const soft =
    tone === 'accent'
      ? colors.accentSoft
      : tone === 'success'
        ? colors.successSoft
        : tone === 'warning'
          ? colors.warningSoft
          : colors.primarySoft;
  const ink =
    tone === 'accent'
      ? colors.accent
      : tone === 'success'
        ? colors.success
        : tone === 'warning'
          ? colors.warning
          : colors.primary;
  return (
    <SurfaceCard style={styles.statTile}>
      <View style={[styles.iconBubble, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={18} color={ink} />
      </View>
      <Text style={[styles.statValue, { color: ink }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </SurfaceCard>
  );
}

export function MenuTile({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <SurfaceCard onPress={onPress} style={styles.menuTile}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.menuTitle} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.menuSub} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.menuChevron}>
        <Ionicons name="chevron-back" size={16} color={colors.muted} />
      </View>
    </SurfaceCard>
  );
}

export function ListCard({
  title,
  lines,
  badge,
  onPress,
}: {
  title: string;
  lines?: string[];
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <SurfaceCard onPress={onPress} style={styles.listCard}>
      <View style={styles.listCardTop}>
        <Text style={styles.listTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {lines?.map((line) => (
        <Text key={line} style={styles.listLine}>
          {line}
        </Text>
      ))}
    </SurfaceCard>
  );
}

export function SearchField(props: TextInputProps) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[styles.searchInput, props.style]}
        textAlign="right"
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.white} style={{ marginLeft: 8 }} /> : null}
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ghostBtn}>
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function LoadingBlock({ label = 'در حال بارگذاری...' }: { label?: string }) {
  return (
    <View style={styles.centerBlock}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyBlock({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <SurfaceCard style={styles.centerBlock}>
      <Ionicons name="file-tray-outline" size={28} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </SurfaceCard>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: spacing.md },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md },
  heroEyebrow: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'right', marginBottom: 4 },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'right',
  },
  heroSub: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  cardPrimary: { backgroundColor: colors.primarySoft, borderColor: '#C9E4E4' },
  cardAccent: { backgroundColor: colors.accentSoft, borderColor: '#F3D5C5' },
  cardSuccess: { backgroundColor: colors.successSoft, borderColor: '#C8E9DB' },
  cardWarning: { backgroundColor: colors.warningSoft, borderColor: '#F3E2B8' },
  statTile: { width: '47%', minHeight: 110 },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 22, fontFamily: fonts.bold, fontWeight: '700', textAlign: 'right' },
  statLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'right', marginTop: 2 },
  menuTile: { width: '47%', minHeight: 128, justify: 'relative' },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  menuSub: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'right', marginTop: 4 },
  menuChevron: { position: 'absolute', left: spacing.md, bottom: spacing.md },
  listCard: { marginBottom: spacing.sm },
  listCardTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
    flex: 1,
  },
  listLine: { fontSize: 12, fontFamily: fonts.regular, color: colors.inkSoft, textAlign: 'right', marginTop: 2 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.ink },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryDeep },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.bold, fontWeight: '700' },
  ghostBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ghostLabel: { color: colors.white, fontWeight: '600', textAlign: 'center' },
  sectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
  },
  centerBlock: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  muted: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },
} as any);
