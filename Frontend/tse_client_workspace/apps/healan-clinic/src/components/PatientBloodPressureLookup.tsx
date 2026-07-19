import React, { useEffect, useState } from 'react';
import healanApi from '../api/healanApi';
import type { PatientBloodPressureHistoryResult, PatientBloodPressureItem } from '../api/types';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { isValidIranNationalCode } from '../utils/nationalCode';
import { ListPagination, useListPagination } from './ListPagination';

type Props = {
  onAlert: (msg: unknown) => void;
  /** Prefill when opened from patient row */
  initialNationalCode?: string;
  onClose?: () => void;
};

function asItems(res: PatientBloodPressureHistoryResult | null): PatientBloodPressureItem[] {
  if (!res) return [];
  return Array.isArray(res.items) ? res.items : [];
}

export function PatientBloodPressureLookup({ onAlert, initialNationalCode = '', onClose }: Props) {
  const [nationalCode, setNationalCode] = useState(initialNationalCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatientBloodPressureHistoryResult | null>(null);
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(10);

  const search = async (code?: string) => {
    const nc = (code ?? nationalCode).replace(/\D/g, '');
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

  useEffect(() => {
    const nc = (initialNationalCode || '').replace(/\D/g, '');
    if (nc.length === 10 && isValidIranNationalCode(nc)) {
      void search(nc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- فقط با کد اولیه از ردیف جدول
  }, [initialNationalCode]);

  const items = asItems(result);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
      <div className="healan-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>سوابق فشار خون بیمار</h3>
        {onClose && (
          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={onClose}>
            بستن
          </button>
        )}
      </div>
      <div className="healan-card__body">
        <div className="healan-form-grid" style={{ alignItems: 'end', marginBottom: '1rem' }}>
          <div className="healan-form-field">
            <label>کد ملی</label>
            <input
              value={nationalCode}
              maxLength={10}
              inputMode="numeric"
              placeholder="۱۰ رقم"
              onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void search();
              }}
            />
          </div>
          <div className="healan-actions">
            <button type="button" className="healan-btn healan-btn--primary" disabled={loading} onClick={() => void search()}>
              {loading ? 'در حال جستجو...' : 'مشاهده فشار خون'}
            </button>
          </div>
        </div>

        {result && (
          <>
            <p style={{ marginBottom: '0.75rem', color: '#4b5563' }}>
              {result.firstName} {result.lastName} · کد ملی {result.nationalCode}
              {items.length === 0 ? ' — رکوردی ثبت نشده است.' : ` — ${items.length} رکورد`}
            </p>

            {items.length > 0 && (
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
                          <td>{row.periodTitle || '—'}</td>
                          <td>{row.measuredTime || '—'}</td>
                          <td>{row.systolic}</td>
                          <td>{row.diastolic}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
