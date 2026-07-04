import React, { useEffect, useState } from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import healanApi from 'apps/cash-market/src/Controller/Healan/api';
import { PageHeader } from '../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate } from '@tse/utils';

function PrescriptionsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healanApi.prescriptions.list({ pageNumber: 1, pageSize: 50 })
      .then((res: { items?: Record<string, unknown>[] }) => setItems(res.items ?? []))
      .catch(onAlert)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="نسخه‌های پزشکی" subtitle="لیست نسخه‌های صادر شده" />
      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">نسخه‌ای ثبت نشده است</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>تاریخ</th>
                  <th>بیمار</th>
                  <th>پزشک</th>
                  <th>یادداشت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={String(p.prescriptionId)}>
                    <td>{p.issueDate ? convertDateAndTimeToJalali(String(p.issueDate)) : '—'}</td>
                    <td>{String(p.patientName ?? '—')}</td>
                    <td>{String(p.doctorName ?? '—')}</td>
                    <td>{String(p.notes ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(PrescriptionsPage);
