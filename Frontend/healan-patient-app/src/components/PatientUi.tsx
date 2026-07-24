import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, fonts, radius, spacing } from '../theme';

type Ion = ComponentProps<typeof Ionicons>['name'];

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'ok' | 'warn' | 'danger' | 'neutral' | 'info';
}) {
  const map = {
    ok: { bg: colors.successSoft, fg: colors.success },
    warn: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.primarySoft, fg: colors.primaryDeep },
    neutral: { bg: colors.accentSoft, fg: colors.inkSoft },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <View style={styles.pager}>
      <Pressable
        disabled={page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={[styles.pagerBtn, page >= totalPages && styles.pagerDisabled]}
      >
        <Text style={styles.pagerBtnText}>بعدی</Text>
      </Pressable>
      <Text style={styles.pagerLabel}>
        صفحه {page} از {totalPages}
      </Text>
      <Pressable
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
        style={[styles.pagerBtn, page <= 1 && styles.pagerDisabled]}
      >
        <Text style={styles.pagerBtnText}>قبلی</Text>
      </Pressable>
    </View>
  );
}

export function SmallTile({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: Ion;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallTile, pressed && { opacity: 0.88 }]}>
      <View style={styles.smallIcon}>
        <Ionicons name={icon} size={22} color={colors.primaryDeep} />
      </View>
      <Text style={styles.smallTitle} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
}

export function LargeActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: Ion;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.largeCard, pressed && { opacity: 0.92 }]}>
      <View style={styles.largeIcon}>
        <Ionicons name={icon} size={28} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.largeTitle}>{title}</Text>
        <Text style={styles.largeSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
    </Pressable>
  );
}

export function ServiceCard({
  title,
  body,
  color,
  compact = false,
}: {
  title: string;
  body?: string;
  color?: string;
  /** کارت فشرده برای اسکرول افقی وقتی تعداد خدمات زیاد است */
  compact?: boolean;
}) {
  const accent = color && /^#/.test(color) ? color : colors.primaryDeep;
  if (compact) {
    return (
      <View style={[styles.serviceCompact, { borderTopColor: accent }]}>
        <View style={[styles.serviceDot, { backgroundColor: accent, marginTop: 0 }]} />
        <Text style={styles.serviceCompactTitle} numberOfLines={2}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.serviceCompactBody} numberOfLines={2}>
            {body}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <View style={[styles.serviceCard, { borderRightColor: accent }]}>
      <View style={[styles.serviceDot, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceTitle}>{title}</Text>
        {body ? (
          <Text style={styles.serviceBody} numberOfLines={2}>
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function PeriodChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const items = [
    { key: 1, label: 'صبح', tone: '#F4FAC8' },
    { key: 2, label: 'ظهر', tone: '#E0F2FE' },
    { key: 3, label: 'شب', tone: '#EDE9FE' },
  ];
  return (
    <View style={styles.periodRow}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[
              styles.periodChip,
              { backgroundColor: item.tone },
              active && styles.periodChipActive,
            ]}
          >
            <Text style={[styles.periodText, active && styles.periodTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SlotChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.slotChip, selected && styles.slotChipSelected]}
    >
      <Text style={[styles.slotChipText, selected && styles.slotChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function bookingStatusTone(status?: number, title?: string): {
  label: string;
  tone: 'ok' | 'warn' | 'danger' | 'neutral' | 'info';
} {
  const t = (title || '').trim();
  if (status === 1 || /تأیید|فعال|رزرو|در انتظار|pending|confirmed/i.test(t)) {
    return { label: t || 'فعال', tone: 'ok' };
  }
  if (status === 2 || /انجام|completed|ویزیت/i.test(t)) {
    return { label: t || 'انجام‌شده', tone: 'info' };
  }
  if (status === 3 || /لغو|cancel/i.test(t)) {
    return { label: t || 'لغو شده', tone: 'danger' };
  }
  return { label: t || `وضعیت ${status ?? '—'}`, tone: 'neutral' };
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 11 },
  pager: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: 8,
  },
  pagerBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pagerDisabled: { opacity: 0.4 },
  pagerBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primaryDeep },
  pagerLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft },
  smallTile: {
    flexGrow: 1,
    flexBasis: '30%',
    maxWidth: '32%',
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 2,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  smallIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  smallTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
  largeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  largeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: 'right' },
  largeSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
  periodRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: spacing.sm },
  periodChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodChipActive: { borderColor: colors.primaryDeep },
  periodText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkSoft },
  periodTextActive: { color: colors.primaryDeep, fontFamily: fonts.bold },
  slotChip: {
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 88,
    alignItems: 'center',
  },
  slotChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  slotChipText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink },
  slotChipTextSelected: { color: '#047857', fontFamily: fonts.bold },
  serviceCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRightWidth: 4,
  },
  serviceCompact: {
    width: 148,
    minHeight: 96,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 3,
  },
  serviceCompactTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 18,
  },
  serviceCompactBody: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 16,
  },
  serviceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  serviceTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
  },
  serviceBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 6,
    lineHeight: 20,
  },
});
