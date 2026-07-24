import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { PortalHeroSlide } from '../api/healan';

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
  brand = 'کلینیک',
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
          {onBell ? <HeaderIcon name="notifications-outline" onPress={onBell} /> : null}
          {onSupport ? <HeaderIcon name="headset-outline" onPress={onSupport} /> : null}
          {onScan ? <HeaderIcon name="phone-portrait-outline" onPress={onScan} /> : null}
        </View>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandText}>{brand}</Text>
            <Text style={styles.buildMark}>build-v22-phase-d</Text>
          </View>
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

/** Website hero slides in QBank-style rounded banner */
export function SiteHeroCarousel({
  slides,
  fallbackTitle,
  fallbackSubtitle,
  onFallbackPress,
}: {
  slides: PortalHeroSlide[];
  fallbackTitle: string;
  fallbackSubtitle?: string;
  onFallbackPress?: () => void;
}) {
  const width = Dimensions.get('window').width - spacing.md * 2;
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scroller.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length, width]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / width));
  };

  if (!slides.length) {
    return (
      <View style={{ marginHorizontal: spacing.md }}>
        <Pressable
          onPress={onFallbackPress}
          style={({ pressed }) => [styles.heroBanner, { width }, pressed && { opacity: 0.95 }]}
        >
          <View style={styles.heroFallbackCopy}>
            <Text style={styles.heroTitle}>{fallbackTitle}</Text>
            {fallbackSubtitle ? <Text style={styles.heroSub}>{fallbackSubtitle}</Text> : null}
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>مشاهده صف</Text>
              <Ionicons name="chevron-back" size={14} color={colors.primaryInk} />
            </View>
          </View>
          <View style={styles.heroArt}>
            <Ionicons name="medkit" size={40} color={colors.primaryDeep} />
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="fast"
        style={{ marginHorizontal: spacing.md }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.heroBanner, { width }]}>
            {slide.imageUrl ? (
              <Image source={{ uri: slide.imageUrl }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
                <Ionicons name="images-outline" size={36} color={colors.primaryDeep} />
              </View>
            )}
            <View style={styles.heroOverlay}>
              {slide.title ? <Text style={styles.heroOverlayTitle}>{slide.title}</Text> : null}
              {slide.subtitle ? <Text style={styles.heroOverlaySub}>{slide.subtitle}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 3-col quick action tile */
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
  onLongPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
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
  badgeTone = 'neutral',
  onPress,
  onLongPress,
}: {
  title: string;
  lines?: string[];
  badge?: string;
  badgeTone?: 'ok' | 'warn' | 'danger' | 'neutral' | 'info';
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const tone = {
    ok: { bg: '#D1FAE5', fg: '#059669' },
    warn: { bg: '#FEF3C7', fg: '#D97706' },
    danger: { bg: '#FEE2E2', fg: '#DC2626' },
    info: { bg: colors.primarySoft, fg: colors.primaryDeep },
    neutral: { bg: colors.bg, fg: colors.inkSoft },
  }[badgeTone];
  return (
    <SurfaceCard onPress={onPress} onLongPress={onLongPress} style={styles.listCard}>
      <View style={styles.listCardTop}>
        <Text style={styles.listTitle}>{title}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{badge}</Text>
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

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  multiline?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlign="right"
        style={[styles.formInput, multiline && styles.formInputMulti]}
      />
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.primary }}
        thumbColor={colors.white}
      />
      <Text style={styles.formLabel}>{label}</Text>
    </View>
  );
}

export function FormModal({
  visible,
  title,
  children,
  onClose,
  onSave,
  saving,
  saveLabel = 'ذخیره',
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeXBtn} accessibilityLabel="بستن">
              <Ionicons name="close" size={22} color="#DC2626" />
            </Pressable>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <PrimaryButton
            label={saving ? 'در حال ذخیره...' : saveLabel}
            onPress={onSave}
            disabled={saving}
          />
        </View>
      </View>
    </Modal>
  );
}

export type ActionSheetItem = {
  key: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
};

export function ActionSheet({
  visible,
  title,
  subtitle,
  items,
  onClose,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.actionTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={styles.actionItem}
            >
              <Text style={[styles.actionLabel, item.danger && styles.actionDanger]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={[styles.actionItem, styles.actionCancel]}>
            <Text style={styles.actionLabel}>انصراف</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
    textAlign: 'right',
  },
  buildMark: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'right',
    marginTop: 2,
  },
  bankActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { padding: 8 },
  heroBanner: {
    height: 168,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroImagePlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  heroOverlayTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    textAlign: 'right',
  },
  heroOverlaySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    marginTop: 4,
  },
  heroFallbackCopy: { flex: 1, padding: spacing.md },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  heroCta: {
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
  heroCtaText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primaryInk },
  heroArt: {
    width: 72,
    height: 72,
    marginLeft: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: { backgroundColor: colors.primaryInk, width: 8, height: 8 },
  iconCell: {
    width: '33.33%',
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
  formField: { marginBottom: spacing.sm },
  formLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  formInputMulti: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  modalClose: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.muted },
  closeXBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingBottom: spacing.md, gap: 4 },
  actionSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  actionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  actionItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  actionCancel: { borderBottomWidth: 0, marginTop: 4 },
  actionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  actionDanger: { color: colors.danger },
} as any);
