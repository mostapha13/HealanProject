import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, LoadingBlock, PrimaryButton, SurfaceCard } from '../../../src/components/Ui';
import { useSite } from '../../../src/site/SiteContext';
import { colors, fonts, spacing } from '../../../src/theme';

const DEFAULT_ADDRESS =
  'شوشتر، خیابان طالقانی، پایین‌تر از خیابان سادات، ساختمان پزشکان دکتر جلالی (آزمایشگاه سلامت)، طبقه دوم، واحد ۲';

function toMapsEmbed(link: string): string {
  const raw = (link || '').trim();
  if (!raw) {
    return 'https://maps.google.com/maps?q=Shushtar+Taleghani&z=16&output=embed';
  }
  if (raw.includes('output=embed')) return raw;
  try {
    const u = new URL(raw);
    let q = u.searchParams.get('q') || '';
    if (!q && u.pathname.includes('/search/')) {
      q = decodeURIComponent(u.pathname.split('/search/')[1] || '').replace(/\+/g, ' ');
    }
    if (!q) q = 'Shushtar Taleghani';
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  } catch {
    return `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&z=16&output=embed`;
  }
}

function MapEmbed({ uri }: { uri: string }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapWeb}>
        {/* react-native-webview is native-only; use iframe on web */}
        {React.createElement('iframe', {
          src: uri,
          title: 'map',
          style: {
            border: 0,
            width: '100%',
            height: '100%',
            borderRadius: 18,
          },
          loading: 'lazy',
          referrerPolicy: 'no-referrer-when-downgrade',
          allow: 'fullscreen',
        })}
      </View>
    );
  }

  // Lazy require so web bundle does not throw "does not support this platform"
  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
  return (
    <WebView
      source={{ uri }}
      style={styles.mapWeb}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.mapLoading}>
          <LoadingBlock />
        </View>
      )}
    />
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  if (!value) return null;
  const body = (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {body}
    </Pressable>
  );
}

function buildFullAddress(opts: {
  address?: string;
  city?: string;
  building?: string;
  detail?: string;
  header?: string;
}): string {
  const address = (opts.address || '').trim();
  if (address && address !== (opts.city || '').trim() && address.length > 8) {
    return address;
  }
  const parts = [opts.header, opts.building, opts.detail, opts.city]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  if (unique.length) return unique.join('، ');
  return DEFAULT_ADDRESS;
}

export default function ContactTabScreen() {
  const { content, loading, refresh } = useSite();
  const { contact, map } = content;
  const embed = useMemo(() => toMapsEmbed(map.link), [map.link]);
  const fullAddress = useMemo(
    () =>
      buildFullAddress({
        address: contact.address,
        city: contact.city,
        building: map.building,
        detail: map.detail,
        header: map.header,
      }),
    [contact.address, contact.city, map.building, map.detail, map.header]
  );

  return (
    <AppScreen padded={false}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <Text style={styles.topTitle}>اطلاعات تماس</Text>
        <Text style={styles.topSub}>{contact.title}</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.primaryDeep} />
        }
      >
        {loading && !contact.phone && !fullAddress ? (
          <LoadingBlock />
        ) : (
          <>
            {contact.lead ? <Text style={styles.lead}>{contact.lead}</Text> : null}

            <SurfaceCard>
              <InfoRow icon="location-outline" label="آدرس" value={fullAddress} />
              <InfoRow
                icon="call-outline"
                label="تماس"
                value={contact.phoneDisplay || contact.phone}
                onPress={
                  contact.phone
                    ? () => void Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`)
                    : undefined
                }
              />
              <InfoRow icon="time-outline" label="ساعت پذیرش" value={contact.hours} />
            </SurfaceCard>

            <Text style={styles.mapTitle}>{map.header || 'موقعیت روی نقشه'}</Text>
            {(map.building || map.detail) && (
              <Text style={styles.mapMeta}>
                {[map.building, map.detail].filter(Boolean).join(' · ')}
              </Text>
            )}

            <View style={styles.mapFrame}>
              <MapEmbed uri={embed} />
            </View>

            <PrimaryButton
              label="باز کردن در Google Maps"
              icon="map-outline"
              onPress={() => void Linking.openURL(map.link || embed)}
            />
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.white,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  topSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 4,
  },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  lead: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
  infoValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 22,
  },
  mapTitle: {
    marginTop: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'right',
  },
  mapMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  mapFrame: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  mapWeb: { flex: 1, width: '100%', height: '100%', backgroundColor: colors.bg },
  mapLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
