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
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme';
import type { IconName } from '../navigation/catalog';

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

/** Lime bank-style top bar */
export function BankHeader({
  brand = 'هیلن کلینیک',
  onBell,
  onSupport,
  onScan,
}: {
  brand?: string;
  onBell?: () => void;
  onSupport?: () => void;
  onScan?: () => void;
}) {
  return (
    <View style={styles.bankHeader}>
      <View style={styles.bankHeaderInner}>
        <View style={styles.bankActions}>
          <HeaderIcon name="notifications-outline" onPress={onBell} />
          <HeaderIcon name="headset-outline" onPress={onSupport} />
          <HeaderIcon name="qr-code-outline" onPress={onScan} />
        </View>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>{brand}</Text>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>H</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function HeaderIcon({ name, onPress }: { name: IconName; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.headerIconBtn}>
      <Ionicons name={name} size={22} color={colors.primaryInk} />
    </Pressable>
  );
}

/** Promo / status banner under lime header */
export function PromoBanner({
  title,
  subtitle,
  cta,
  onPress,
}: {
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.promo, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.promoCopy}>
        <Text style={styles.promoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.promoSub}>{subtitle}</Text> : null}
        {cta ? (
          <View style={styles.promoCta}>
            <Text style={styles.promoCtaText}>{cta}</Text>
            <Ionicons name="chevron-back" size={14} color={colors.primaryInk} />
          </View>
        ) : null}
      </View>
      <View style={styles.promoArt}>
        <Ionicons name="medkit" size={42} color={colors.primaryDeep} />
      </View>
    </Pressable>
  );
}

/** 4-col quick action tile */
export function IconGridItem({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconCell, pressed && { opacity: 0.85 }]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={26} color={colors.ink} />
      </View>
      <Text style={styles.iconLabel} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Large 2-col feature card */
export function FeatureCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featureCard, pressed && styles.cardPressed]}
    >
      <Ionicons name="chevron-back" size={18} color={colors.muted} style={styles.featureChevron} />
      <View style={styles.featureBody}>
        <View style={styles.featureIconWrap}>
          <Ionicons name={icon} size={22} color={colors.ink} />
        </View>
        <Text style={styles.featureTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function SurfaceCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
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
  icon?: IconName;
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
      {icon ? <Ionicons name={icon} size={18} color={colors.primaryInk} style={{ marginLeft: 8 }} /> : null}
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  dark,
}: {
  label: string;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.ghostBtn, dark && styles.ghostBtnDark]}>
      <Text style={[styles.ghostLabel, dark && styles.ghostLabelDark]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function LoadingBlock({ label = 'در حال بارگذاری...' }: { label?: string }) {
  return (
    <View style={styles.centerBlock}>
      <ActivityIndicator color={colors.primaryDeep} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyBlock({ title, subtitle }: { title: string; subtitle?: string }) {
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
  bankHeader: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    paddingBottom: spacing.md,
  },
  bankHeaderInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: colors.primary, fontFamily: fonts.bold, fontSize: 18 },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryInk,
  },
  bankActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  promo: {
    marginTop: -spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  promoCopy: { flex: 1 },
  promoTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
  },
  promoSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  promoCta: {
    marginTop: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  promoCtaText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryInk },
  promoArt: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 16,
  },
  featureCard: {
    width: '48%',
    minHeight: 112,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  featureBody: { flex: 1, justifyContent: 'space-between', alignItems: 'flex-end' },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  featureChevron: { position: 'absolute', left: spacing.md, top: '42%' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  listCard: { marginBottom: spacing.sm },
  listCardTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
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
  badgeText: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.primaryInk },
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
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.ink, fontFamily: fonts.regular },
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
  buttonLabel: { color: colors.primaryInk, fontSize: 16, fontFamily: fonts.bold },
  ghostBtn: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  ghostBtnDark: { borderColor: colors.line, backgroundColor: colors.white },
  ghostLabel: { color: colors.primaryInk, fontFamily: fonts.semiBold, textAlign: 'center' },
  ghostLabelDark: { color: colors.ink },
  sectionRow: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'right',
  },
  centerBlock: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, textAlign: 'center' },
  muted: { fontSize: 12, fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },
} as any);
