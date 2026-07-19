import React, { useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PatientBloodPressureHistoryResult, PatientBloodPressureItem } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { ReportsChart } from '../../components/ReportsChart';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { isValidIranNationalCode } from '../../utils/nationalCode';
import { ListPagination, useListPagination } from '../../components/ListPagination';

function asItems(res: PatientBloodPressureHistoryResult | null): PatientBloodPressureItem[] {
  if (!res) return [];
  return Array.isArray(res.items) ? res.items : [];
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
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  const chartItems = useMemo(() => {
    // نمودار از قدیم به جدید خواناتر است
    return [...items].reverse().slice(-20);
  }, [items]);

  const categories = chartItems.map((r) => {
    try {
      return convertDateAndTimeToJalali(r.measuredAt);
    } catch {
      return r.measuredAt;
    }
  });

  const systolic = chartItems.map((r) => r.systolic);
  const diastolic = chartItems.map((r) => r.diastolic);

  const latest = items[0];

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
                {latest?.periodTitle || ''}
                {latest?.measuredTime ? ` · ${latest.measuredTime}` : ''}
              </span>
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
                  height={360}
                />
              </div>
            </div>
          )}

          <div className="healan-card">
            <div className="healan-card__header">
              <h3>لیست ثبت‌ها</h3>
            </div>
            <div className="healan-card__body" style={{ padding: 0 }}>
              {items.length === 0 ? (
                <div className="healan-empty">برای این بیمار فشاری ثبت نشده است.</div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="healan-table">
                      <thead>
                        <tr>
                          <th>تاریخ</th>
                          <th>بازه</th>
                          <th>ساعت</th>
                          <th>سیستولیک</th>
                          <th>دیاستولیک</th>
                          <th>نبض</th>
                          <th>یادداشت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((row) => (
                          <tr key={row.id}>
                            <td>{row.measuredAt ? convertDateAndTimeToJalali(row.measuredAt) : '—'}</td>
                            <td>
                              {row.periodTitle ? (
                                <span className={`healan-bp-period healan-bp-period--${row.periodOfDay || 0}`}>
                                  {row.periodTitle}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>{row.measuredTime || '—'}</td>
                            <td>
                              <strong style={{ color: '#dc2626' }}>{row.systolic}</strong>
                            </td>
                            <td>
                              <strong style={{ color: '#2563eb' }}>{row.diastolic}</strong>
                            </td>
                            <td>{row.pulse ?? '—'}</td>
                            <td>{row.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ListPagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={items.length}
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
