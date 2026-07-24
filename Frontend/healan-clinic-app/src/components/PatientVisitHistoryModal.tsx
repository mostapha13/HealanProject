import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPatientVisitHistory,
  type PatientVisitHistoryItem,
} from '../api/healan';
import { fileDownloadUrl } from '../api/fileUpload';
import { EmptyBlock, LoadingBlock, PrimaryButton } from './Ui';
import { colors, fonts, radius, spacing } from '../theme';
import { formatJalaliDate, formatJalaliDateTime, toPersianDigits } from '../utils/jalali';

type Props = {
  visible: boolean;
  patientId: number;
  patientName?: string;
  onClose: () => void;
};

type DayGroup = {
  dateKey: string;
  jalaliLabel: string;
  visits: PatientVisitHistoryItem[];
};

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10) || 'unknown';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function groupByDay(items: PatientVisitHistoryItem[]): DayGroup[] {
  const map = new Map<string, PatientVisitHistoryItem[]>();
  for (const item of items) {
    const key = toDateKey(item.appointmentDate);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([dateKey, visits]) => ({
      dateKey,
      jalaliLabel: formatJalaliDate(visits[0]?.appointmentDate) || dateKey,
      visits,
    }));
}

function attachmentUrl(id?: string | null, link?: string | null): string | null {
  if (id) return fileDownloadUrl(String(id));
  if (link && /^https?:\/\//i.test(link)) return link;
  return null;
}

function isImageAttachment(fileName?: string | null, link?: string | null): boolean {
  const name = `${fileName ?? ''} ${link ?? ''}`.toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(name) || name.includes('/download/');
}

function AttachmentBlock({
  label,
  attachmentId,
  attachmentLink,
  attachmentFileName,
}: {
  label: string;
  attachmentId?: string | null;
  attachmentLink?: string | null;
  attachmentFileName?: string | null;
}) {
  const url = attachmentUrl(attachmentId, attachmentLink);
  if (!url) return null;
  const showPreview = isImageAttachment(attachmentFileName, attachmentLink) || Boolean(attachmentId);
  return (
    <View style={styles.attachBox}>
      <Text style={styles.attachLabel}>{label}</Text>
      {showPreview ? (
        <Pressable onPress={() => void Linking.openURL(url)}>
          <Image source={{ uri: url }} style={styles.attachImage} resizeMode="cover" />
        </Pressable>
      ) : null}
      <Pressable onPress={() => void Linking.openURL(url)}>
        <Text style={styles.link}>
          {attachmentFileName?.trim() || 'مشاهده / دانلود پیوست'}
        </Text>
      </Pressable>
    </View>
  );
}

function VisitCard({ visit }: { visit: PatientVisitHistoryItem }) {
  const [open, setOpen] = useState(true);
  const timeLabel = formatJalaliDateTime(visit.appointmentDate);

  return (
    <View style={styles.visitCard}>
      <Pressable style={styles.visitHead} onPress={() => setOpen((v) => !v)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.visitTime}>{timeLabel || '—'}</Text>
          <Text style={styles.visitMeta}>
            {[visit.doctorName || 'پزشک نامشخص', visit.appointmentStatus]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {visit.prescriptionId ? (
            <Text style={styles.visitRx}>
              نسخه #{toPersianDigits(visit.prescriptionId)}
              {visit.prescriptionIssueDate
                ? ` · صدور ${formatJalaliDate(visit.prescriptionIssueDate)}`
                : ''}
            </Text>
          ) : (
            <Text style={styles.visitNoRx}>نسخه ثبت نشده</Text>
          )}
        </View>
        <Text style={styles.expand}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.visitBody}>
          {!visit.prescriptionId ? (
            <Text style={styles.muted}>برای این ویزیت نسخه‌ای ثبت نشده است.</Text>
          ) : (
            <>
              {visit.prescriptionNotes ? (
                <Text style={styles.notes}>
                  <Text style={styles.sectionTitleInline}>یادداشت: </Text>
                  {visit.prescriptionNotes}
                </Text>
              ) : null}

              {(visit.hasEchoReport || visit.echoConclusion || visit.echoRecommendation) && (
                <View style={styles.block}>
                  <Text style={styles.sectionTitle}>اکوکاردیوگرافی</Text>
                  {visit.echoConclusion ? (
                    <Text style={styles.line}>نتیجه: {visit.echoConclusion}</Text>
                  ) : null}
                  {visit.echoRecommendation ? (
                    <Text style={styles.line}>توصیه: {visit.echoRecommendation}</Text>
                  ) : null}
                  {!visit.echoConclusion && !visit.echoRecommendation ? (
                    <Text style={styles.muted}>گزارش اکو ثبت شده است.</Text>
                  ) : null}
                </View>
              )}

              <View style={styles.block}>
                <Text style={styles.sectionTitle}>داروها</Text>
                {visit.drugs.length ? (
                  visit.drugs.map((d, i) => (
                    <Text key={`d-${i}`} style={styles.line}>
                      • {d.drugName}
                      {d.dosage ? ` — ${d.dosage}` : ''}
                      {d.usageInstructions ? ` (${d.usageInstructions})` : ''}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.muted}>دارویی ثبت نشده</Text>
                )}
              </View>

              <View style={styles.block}>
                <Text style={styles.sectionTitle}>آزمایش‌ها</Text>
                {visit.labs.length ? (
                  visit.labs.map((l, i) => (
                    <View key={`l-${i}`} style={styles.itemBlock}>
                      <Text style={styles.line}>
                        • {l.labTestType}
                        {l.notes ? ` — ${l.notes}` : ''}
                      </Text>
                      <AttachmentBlock
                        label="پیوست آزمایش"
                        attachmentId={l.attachmentId}
                        attachmentLink={l.attachmentLink}
                        attachmentFileName={l.attachmentFileName}
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.muted}>آزمایشی ثبت نشده</Text>
                )}
              </View>

              <View style={styles.block}>
                <Text style={styles.sectionTitle}>تصویربرداری</Text>
                {visit.imaging.length ? (
                  visit.imaging.map((img, i) => (
                    <View key={`i-${i}`} style={styles.itemBlock}>
                      <Text style={styles.line}>
                        • {img.imageTypeName || `نوع #${img.imageTypeId}`}
                        {img.notes ? ` — ${img.notes}` : ''}
                      </Text>
                      <AttachmentBlock
                        label="تصویر پیوست"
                        attachmentId={img.attachmentId}
                        attachmentLink={img.attachmentLink}
                        attachmentFileName={img.attachmentFileName}
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.muted}>تصویربرداری ثبت نشده</Text>
                )}
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

export function PatientVisitHistoryModal({
  visible,
  patientId,
  patientName,
  onClose,
}: Props) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PatientVisitHistoryItem[]>([]);

  useEffect(() => {
    if (!visible || patientId <= 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await fetchPatientVisitHistory(getAccessToken, patientId);
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : 'بارگذاری سوابق ناموفق بود');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, patientId, getAccessToken]);

  const days = useMemo(() => groupByDay(items), [items]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <PrimaryButton label="بستن" onPress={onClose} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>سوابق بیمار</Text>
            {patientName ? <Text style={styles.sub}>{patientName}</Text> : null}
          </View>
        </View>

        {loading ? (
          <LoadingBlock label="در حال دریافت سوابق..." />
        ) : error ? (
          <EmptyBlock title="خطا" subtitle={error} />
        ) : days.length === 0 ? (
          <EmptyBlock title="سابقه‌ای نیست" subtitle="برای این بیمار ویزیت ثبت‌شده‌ای یافت نشد" />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.summary}>
              {toPersianDigits(items.length)} ویزیت در {toPersianDigits(days.length)} روز
            </Text>
            {days.map((day) => (
              <View key={day.dateKey} style={styles.daySection}>
                <View style={styles.dayHead}>
                  <Text style={styles.dayTitle}>{day.jalaliLabel}</Text>
                  <Text style={styles.dayCount}>
                    {toPersianDigits(day.visits.length)} نوبت
                  </Text>
                </View>
                {day.visits.map((v) => (
                  <VisitCard key={v.appointmentId} visit={v} />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryInk,
    textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 2,
  },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  summary: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  daySection: { marginBottom: spacing.lg },
  dayHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  dayTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  dayCount: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primaryDeep,
  },
  visitCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  visitHead: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
  },
  visitTime: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  visitMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 4,
  },
  visitRx: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primaryDeep,
    textAlign: 'right',
    marginTop: 4,
  },
  visitNoRx: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  expand: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  visitBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  block: { marginBottom: spacing.md },
  itemBlock: { marginBottom: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 6,
  },
  sectionTitleInline: { fontFamily: fonts.bold, color: colors.ink },
  notes: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  line: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    lineHeight: 22,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
  },
  attachBox: {
    marginTop: 6,
    marginRight: 12,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 8,
  },
  attachLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 4,
  },
  attachImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: colors.line,
    marginBottom: 6,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#2563EB',
    textAlign: 'right',
  },
});

