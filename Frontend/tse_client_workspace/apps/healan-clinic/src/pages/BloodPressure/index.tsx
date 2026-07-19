import React, { useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PatientBloodPressureHistoryResult, PatientBloodPressureItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { ReportsChart } from '../../components/ReportsChart';
import { formatJalaliDate } from '../../utils/formatJalali';
import {
  groupBloodPressureByDay,
  periodTitle,
  type BpDayRow,
  type BpPeriodSlot,
} from '../../utils/groupBloodPressureByDay';
import { openBloodPressurePrintWindow } from '../../utils/printBloodPressureReport';
import { isValidIranNationalCode } from '../../utils/nationalCode';
import { ListPagination, useListPagination } from '../../components/ListPagination';

function asItems(res: PatientBloodPressureHistoryResult | null): PatientBloodPressureItem[] {
  if (!res) return [];
  return Array.isArray(res.items) ? res.items : [];
}

function slotCell(slot: BpPeriodSlot | undefined, key: keyof BpPeriodSlot) {
  if (!slot) return '—';
  const v = slot[key];
  if (v == null || v === '') return '—';
  return String(v);
}

type PeriodKey = 'morning' | 'noon' | 'night';

function buildPeriodTrend(dayRows: BpDayRow[], periodKey: PeriodKey) {
  const chronological = [...dayRows].sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));
  const withSlot = chronological.filter((d) => d[periodKey]);
  return {
    categories: withSlot.map((d) => d.jalaliLabel),
    systolic: withSlot.map((d) => d[periodKey]!.systolic),
    diastolic: withSlot.map((d) => d[periodKey]!.diastolic),
    count: withSlot.length,
  };
}

const PERIOD_TRENDS: Array<{
  key: PeriodKey;
  title: string;
  badge: string;
  hint: string;
  empty: string;
  accent: string;
  tone: 'morning' | 'noon' | 'evening';
}> = [
  {
    key: 'morning',
    title: 'فشارهای صبح',
    badge: 'صبح',
    hint: 'ترند سیستول و دیاستول در بازه صبح',
    empty: 'هنوز ثبت صبحی برای این بیمار نیست.',
    accent: '#0d9488',
    tone: 'morning',
  },
  {
    key: 'noon',
    title: 'فشارهای ظهر',
    badge: 'ظهر',
    hint: 'ترند سیستول و دیاستول در بازه ظهر',
    empty: 'هنوز ثبت ظهری برای این بیمار نیست.',
    accent: '#0284c7',
    tone: 'noon',
  },
  {
    key: 'night',
    title: 'فشارهای عصر',
    badge: 'عصر',
    hint: 'ترند سیستول و دیاستول در بازه عصر',
    empty: 'هنوز ثبت عصری برای این بیمار نیست.',
    accent: '#7c3aed',
    tone: 'evening',
  },
];

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function PatientsBloodPressurePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [nationalCode, setNationalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatientBloodPressureHistoryResult | null>(null);
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(10);

  const search = async () => {
    const nc = nationalCode.replace(/\D/g, '');
    if (!isValidIranNationalCode(nc)) {
      onAlert({ type: 'error', message: 'کد ملی نامعتبر است.' });
      return;
    }
    setLoading(true);
    setPage(1);
    try {
      const res = await healanApi.patients.bloodPressureHistory({ nationalCode: nc });
      setResult(res);
      setNationalCode(nc);
    } catch (err) {
      setResult(null);
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  const items = asItems(result);
  const dayRows = useMemo(() => groupBloodPressureByDay(items), [items]);
  const pageDays = dayRows.slice((page - 1) * pageSize, page * pageSize);

  const periodTrends = useMemo(
    () =>
      PERIOD_TRENDS.map((meta) => {
        const trend = buildPeriodTrend(dayRows, meta.key);
        const lastSys = trend.systolic.length ? trend.systolic[trend.systolic.length - 1] : null;
        const lastDia = trend.diastolic.length ? trend.diastolic[trend.diastolic.length - 1] : null;
        return {
          ...meta,
          trend,
          lastLabel:
            lastSys != null && lastDia != null ? `${lastSys}/${lastDia}` : '—',
          avgSys: avg(trend.systolic),
          avgDia: avg(trend.diastolic),
        };
      }),
    [dayRows]
  );

  const chartItems = useMemo(() => [...items].reverse().slice(-20), [items]);

  const overviewCategories = chartItems.map((r) => {
    const dateLabel = formatJalaliDate(r.measuredAt) || '—';
    const period = r.periodTitle || periodTitle(r.periodOfDay) || '';
    return period ? `${dateLabel} · ${period}` : dateLabel;
  });

  const overviewSystolic = chartItems.map((r) => r.systolic);
  const overviewDiastolic = chartItems.map((r) => r.diastolic);

  const latest = items[0];

  const printReport = () => {
    if (!result) return;
    try {
      openBloodPressurePrintWindow({
        patientName: `${result.firstName} ${result.lastName}`.trim(),
        patientNationalCode: result.nationalCode,
        printedAtLabel: formatJalaliDate(new Date()) || '',
        days: dayRows,
      });
    } catch (err) {
      onAlert(err instanceof Error ? { type: 'error', message: err.message } : err);
    }
  };

  return (
    <>
      <PageHeader
        title="فشار خون بیماران"
        subtitle="با کد ملی، سوابق ثبت‌شده توسط بیمار را ببینید و روند را روی نمودار بررسی کنید"
      />

      <div className="healan-card healan-bp-lookup">
        <div className="healan-card__body">
          <div className="healan-bp-lookup__search">
            <div className="healan-form-field" style={{ flex: 1, minWidth: 200 }}>
              <label>کد ملی بیمار</label>
              <input
                value={nationalCode}
                maxLength={10}
                inputMode="numeric"
                placeholder="۱۰ رقم کد ملی"
                onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search();
                }}
              />
            </div>
            <button
              type="button"
              className="healan-btn healan-btn--primary healan-bp-lookup__btn"
              disabled={loading}
              onClick={() => void search()}
            >
              {loading ? 'در حال جستجو...' : 'نمایش سوابق'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="healan-bp-summary">
            <div className="healan-bp-summary__card">
              <span className="healan-bp-summary__label">بیمار</span>
              <strong>
                {result.firstName} {result.lastName}
              </strong>
              <span className="healan-bp-summary__muted">کد ملی {result.nationalCode}</span>
            </div>
            <div className="healan-bp-summary__card">
              <span className="healan-bp-summary__label">تعداد ثبت</span>
              <strong>{items.length.toLocaleString('fa-IR')}</strong>
            </div>
            <div className="healan-bp-summary__card">
              <span className="healan-bp-summary__label">آخرین فشار</span>
              <strong>
                {latest ? `${latest.systolic}/${latest.diastolic}` : '—'}
              </strong>
              <span className="healan-bp-summary__muted">
                {latest?.periodTitle || periodTitle(latest?.periodOfDay) || ''}
                {latest?.measuredTime ? ` · ${latest.measuredTime}` : ''}
              </span>
            </div>
            <div className="healan-bp-summary__actions">
              <button
                type="button"
                className="healan-btn healan-btn--outline"
                disabled={dayRows.length === 0}
                onClick={printReport}
              >
                چاپ گزارش
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <section className="healan-bp-analytics" aria-label="تحلیل نمودار فشار خون">
              <div className="healan-bp-analytics__intro">
                <div>
                  <h2 className="healan-bp-analytics__heading">تحلیل نموداری</h2>
                  <p className="healan-bp-analytics__sub">
                    ابتدا نمای کلی همه ثبت‌ها، سپس ترند جدا برای صبح، ظهر و عصر
                  </p>
                </div>
                <div className="healan-bp-analytics__legend">
                  <span className="healan-bp-analytics__chip healan-bp-analytics__chip--sys">سیستولیک</span>
                  <span className="healan-bp-analytics__chip healan-bp-analytics__chip--dia">دیاستولیک</span>
                </div>
              </div>

              <article className="healan-bp-overview">
                <header className="healan-bp-overview__head">
                  <div>
                    <span className="healan-bp-overview__eyebrow">نمای کلی</span>
                    <h3>نمودار ستونی فشار خون</h3>
                    <p>حداکثر ۲۰ ثبت اخیر · برچسب تاریخ و بازه روز روی محور افقی</p>
                  </div>
                  <div className="healan-bp-overview__stat">
                    <span>نقاط روی نمودار</span>
                    <strong>{overviewCategories.length.toLocaleString('fa-IR')}</strong>
                  </div>
                </header>
                <div className="healan-bp-overview__body">
                  <ReportsChart
                    type="column"
                    title="روند کلی فشار خون"
                    hideTitle
                    embedded
                    categories={overviewCategories}
                    yAxisTitle="mmHg"
                    height={340}
                    series={[
                      { name: 'سیستولیک', data: overviewSystolic, color: '#ef4444' },
                      { name: 'دیاستولیک', data: overviewDiastolic, color: '#3b82f6' },
                    ]}
                  />
                </div>
              </article>

              <div className="healan-bp-trends">
                {periodTrends.map(
                  ({ key, title, badge, hint, empty, accent, tone, trend, lastLabel, avgSys, avgDia }) => (
                    <article key={key} className={`healan-bp-trend healan-bp-trend--${tone}`}>
                      <header className="healan-bp-trend__head">
                        <div className="healan-bp-trend__title-wrap">
                          <span className="healan-bp-trend__badge">{badge}</span>
                          <div>
                            <h3>{title}</h3>
                            <p>{hint}</p>
                          </div>
                        </div>
                        <div className="healan-bp-trend__metrics">
                          <div>
                            <span>تعداد</span>
                            <strong>{trend.count.toLocaleString('fa-IR')}</strong>
                          </div>
                          <div>
                            <span>آخرین</span>
                            <strong>{lastLabel}</strong>
                          </div>
                          <div>
                            <span>میانگین</span>
                            <strong>
                              {avgSys != null && avgDia != null ? `${avgSys}/${avgDia}` : '—'}
                            </strong>
                          </div>
                        </div>
                      </header>
                      <div className="healan-bp-trend__body">
                        <ReportsChart
                          type="line"
                          title={title}
                          hideTitle
                          embedded
                          categories={trend.categories}
                          yAxisTitle="mmHg"
                          emptyMessage={empty}
                          height={260}
                          series={[
                            { name: 'سیستولیک', data: trend.systolic, color: '#ef4444' },
                            { name: 'دیاستولیک', data: trend.diastolic, color: accent },
                          ]}
                        />
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

          <div className="healan-card">
            <div className="healan-card__header">
              <h3>لیست روزانه (صبح / ظهر / عصر)</h3>
            </div>
            <div className="healan-card__body" style={{ padding: 0 }}>
              {dayRows.length === 0 ? (
                <div className="healan-empty">برای این بیمار فشاری ثبت نشده است.</div>
              ) : (
                <>
                  <div className="healan-bp-day-table-wrap">
                    <table className="healan-table healan-bp-day-table">
                      <thead>
                        <tr>
                          <th rowSpan={2}>تاریخ</th>
                          <th colSpan={5} className="healan-bp-day-table__period healan-bp-day-table__period--morning">
                            صبح
                          </th>
                          <th colSpan={5} className="healan-bp-day-table__period healan-bp-day-table__period--noon">
                            ظهر
                          </th>
                          <th colSpan={5} className="healan-bp-day-table__period healan-bp-day-table__period--night">
                            عصر
                          </th>
                        </tr>
                        <tr>
                          {(['صبح', 'ظهر', 'عصر'] as const).flatMap((p) =>
                            ['ساعت', 'سیستول', 'دیاستول', 'نبض', 'یادداشت'].map((label) => (
                              <th key={`${p}-${label}`} className="healan-bp-day-table__sub">
                                {label}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {pageDays.map((row) => (
                          <tr key={row.dateKey}>
                            <td className="healan-bp-day-table__date">{row.jalaliLabel}</td>
                            {([row.morning, row.noon, row.night] as const).map((slot, idx) => (
                              <React.Fragment key={idx}>
                                <td>{slotCell(slot, 'measuredTime')}</td>
                                <td>
                                  {slot ? (
                                    <strong style={{ color: '#dc2626' }}>{slot.systolic}</strong>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td>
                                  {slot ? (
                                    <strong style={{ color: '#2563eb' }}>{slot.diastolic}</strong>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td>{slotCell(slot, 'pulse')}</td>
                                <td className="healan-bp-day-table__note">{slotCell(slot, 'note')}</td>
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ListPagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={dayRows.length}
                    onChange={onPaginationChange}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default withAlert(PatientsBloodPressurePage);
