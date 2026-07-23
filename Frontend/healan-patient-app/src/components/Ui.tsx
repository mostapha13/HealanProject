import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, spacing } from '../theme';
import type { PortalHeroSlide } from '../api/portal';
import type { ComponentProps } from 'react';

type Ion = ComponentProps<typeof Ionicons>['name'];

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

export function BankHeader({ brand = 'هیلن بیمار' }: { brand?: string }) {
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.bankHeader}>
      <View style={styles.bankHeaderInner}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandText}>{brand}</Text>
            <Text style={styles.buildMark}>build-v3-otp-cors-fix</Text>
          </View>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

export function SiteHeroCarousel({
  slides,
  fallbackTitle,
  fallbackSubtitle,
}: {
  slides: PortalHeroSlide[];
  fallbackTitle: string;
  fallbackSubtitle?: string;
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
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (!slides.length) {
    return (
      <View style={{ marginHorizontal: spacing.md }}>
        <LinearGradient
          colors={['#C4B5FD', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { width }]}
        >
          <View style={styles.heroFallbackCopy}>
            <Text style={[styles.heroTitle, { color: colors.white }]}>{fallbackTitle}</Text>
            {fallbackSubtitle ? (
              <Text style={[styles.heroSub, { color: 'rgba(255,255,255,0.9)' }]}>{fallbackSubtitle}</Text>
            ) : null}
          </View>
          <View style={styles.heroArt}>
            <Ionicons name="heart" size={40} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
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
              <LinearGradient colors={['#C4B5FD', '#7C3AED']} style={styles.heroImage} />
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

export function IconGridItem({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: Ion;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconCell, pressed && { opacity: 0.85 }]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={26} color={colors.primaryDeep} />
      </View>
      <Text style={styles.iconLabel} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

export function FeatureCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: Ion;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCard, pressed && { opacity: 0.9 }]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.primaryDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        {subtitle ? <Text style={styles.featureSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-back" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function SurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.surface, style]}>{children}</View>;
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
  const body = (
    <View style={styles.listCard}>
      <View style={styles.listCardTop}>
        <Text style={styles.listTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {(lines ?? []).map((line, i) => (
        <Text key={i} style={styles.listLine}>
          {line}
        </Text>
      ))}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9 }}>
      {body}
    </Pressable>
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
  icon?: Ion;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.9 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.primaryInk} /> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SearchField(props: TextInputProps & { value: string; onChangeText: (v: string) => void }) {
  return (
    <TextInput
      {...props}
      textAlign="right"
      placeholderTextColor={colors.muted}
      style={[styles.search, props.style]}
    />
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
        style={[styles.formInput, multiline && { minHeight: 80 }]}
      />
    </View>
  );
}

export function LoadingBlock() {
  return (
    <View style={styles.centerBlock}>
      <ActivityIndicator color={colors.primaryDeep} size="large" />
      <Text style={styles.muted}>در حال بارگذاری...</Text>
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

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.screenHeader}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.primaryInk} />
        </Pressable>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text style={styles.screenHeaderTitle}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: spacing.md },
  bankHeader: {
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    paddingBottom: spacing.md,
  },
  bankHeaderInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  brandText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white, textAlign: 'right' },
  buildMark: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
    marginTop: 2,
  },
  heroBanner: {
    height: 168,
    borderRadius: radius.xl,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  heroImage: { ...StyleSheet.absoluteFill },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(40, 10, 80, 0.35)',
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
  heroTitle: { fontFamily: fonts.bold, fontSize: 16, textAlign: 'right' },
  heroSub: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'right', marginTop: 4 },
  heroArt: { paddingHorizontal: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.primaryDeep, width: 16 },
  iconCell: { width: '33.33%', alignItems: 'center', marginBottom: spacing.md },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconLabel: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  featureCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'right' },
  featureSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  surface: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  listCardTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'right' },
  listLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.primaryDeep },
  primaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primaryInk },
  search: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  centerBlock: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 8 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
  screenHeader: {
    backgroundColor: colors.primaryDeep,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  screenHeaderTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.white },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
