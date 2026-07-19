import React, { useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PatientBloodPressureHistoryResult, PatientBloodPressureItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { ReportsChart } from '../../components/ReportsChart';
import { formatJalaliDate } from '../../utils/formatJalali';
import { groupBloodPressureByDay, periodTitle, type BpPeriodSlot } from '../../utils/groupBloodPressureByDay';
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

  const chartItems = useMemo(() => [...items].reverse().slice(-20), [items]);

  const categories = chartItems.map((r) => {
    const dateLabel = formatJalaliDate(r.measuredAt) || '—';
    const period = r.periodTitle || periodTitle(r.periodOfDay) || '';
    return period ? `${dateLabel} · ${period}` : dateLabel;
  });

  const systolic = chartItems.map((r) => r.systolic);
  const diastolic = chartItems.map((r) => r.diastolic);
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
            <div className="healan-card" style={{ marginBottom: '1.25rem' }}>
              <div className="healan-card__body">
                <ReportsChart
                  type="column"
                  title="روند فشار خون (حداکثر ۲۰ ثبت اخیر)"
                  categories={categories}
                  yAxisTitle="mmHg"
                  series={[
                    { name: 'سیستولیک', data: systolic, color: '#ef4444' },
                    { name: 'دیاستولیک', data: diastolic, color: '#3b82f6' },
                  ]}
                  height={380}
                />
              </div>
            </div>
          )}

          <div className="healan-card">
            <div className="healan-card__header">
              <h3>لیست روزانه (صبح / ظهر / شب)</h3>
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
                            شب
                          </th>
                        </tr>
                        <tr>
                          {(['صبح', 'ظهر', 'شب'] as const).flatMap((p) =>
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
