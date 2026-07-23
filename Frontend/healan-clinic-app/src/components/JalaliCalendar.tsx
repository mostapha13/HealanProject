import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme';
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  formatJalaliYmd,
  jalaliMonthLength,
  jalaliWeekday,
  parseJalaliYmd,
  shiftJalaliMonth,
  toJalali,
  toPersianDigits,
} from '../utils/jalali';

type Props = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (dateYmd: string) => void;
};

export function JalaliCalendarModal({ visible, value, onClose, onSelect }: Props) {
  const today = (() => {
    const n = new Date();
    return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  })();
  const [viewJy, setViewJy] = useState(today.jy);
  const [viewJm, setViewJm] = useState(today.jm);

  useEffect(() => {
    if (!visible) return;
    const next = parseJalaliYmd(value) ?? today;
    setViewJy(next.jy);
    setViewJm(next.jm);
  }, [visible, value]);

  const cells = useMemo(() => {
    const daysInMonth = jalaliMonthLength(viewJy, viewJm);
    const startDow = jalaliWeekday(viewJy, viewJm, 1);
    const blanks = Array.from({ length: startDow }, () => null as number | null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [viewJy, viewJm]);

  const selected = parseJalaliYmd(value);

  const goMonth = (delta: number) => {
    const next = shiftJalaliMonth(viewJy, viewJm, delta);
    setViewJy(next.jy);
    setViewJm(next.jm);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable onPress={() => goMonth(1)} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>
              {JALALI_MONTH_NAMES[viewJm - 1]} {toPersianDigits(viewJy)}
            </Text>
            <Pressable onPress={() => goMonth(-1)} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {JALALI_WEEKDAY_NAMES.map((d) => (
              <Text key={d} style={styles.weekLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) {
                return <View key={`b-${idx}`} style={styles.cell} />;
              }
              const isSelected =
                selected?.jy === viewJy && selected?.jm === viewJm && selected?.jd === day;
              const isToday = today.jy === viewJy && today.jm === viewJm && today.jd === day;
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.cell,
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => {
                    onSelect(formatJalaliYmd(viewJy, viewJm, day));
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {toPersianDigits(day)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.todayBtn} onPress={() => {
            setViewJy(today.jy);
            setViewJm(today.jm);
            onSelect(formatJalaliYmd(today.jy, today.jm, today.jd));
            onClose();
          }}>
            <Text style={styles.todayBtnText}>برو به امروز</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCell: {
    borderRadius: 12,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.primaryDeep,
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  todayText: {
    color: colors.primaryDeep,
  },
  selectedText: {
    color: colors.primaryInk,
    fontFamily: fonts.bold,
  },
  todayBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  todayBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primaryInk,
  },
});
