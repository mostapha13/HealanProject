import React, { useEffect, useState } from 'react';
import { patientMyHistory, type PortalMyHistory } from '../../api/portalApi';

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function PatientHistoryPage() {
  const [data, setData] = useState<PortalMyHistory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await patientMyHistory();
        if (!alive) return;
        setData(res ?? {});
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'بارگذاری سوابق ناموفق بود');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const bookingList = Array.isArray(data?.bookings) ? data!.bookings! : [];
  const visitList = Array.isArray(data?.visits) ? data!.visits! : [];

  return (
    <div className="portal-patient__panel">
      <h1 className="portal-patient__title">سوابق من</h1>
      <p className="portal-patient__lead">رزروهای پورتال و ویزیت‌های ثبت‌شده در مطب.</p>
      {error && <div className="portal-patient__error">{error}</div>}
      {loading && <p className="portal-patient__hint">در حال بارگذاری…</p>}

      {!loading && (
        <>
          <section className="portal-patient__section">
            <h2>رزروهای نوبت</h2>
            {bookingList.length === 0 ? (
              <p className="portal-patient__hint">رزروی یافت نشد.</p>
            ) : (
              <ul className="portal-patient__list">
                {bookingList.map((b, i) => (
                  <li key={b.appointmentBookingId ?? i}>
                    <strong>{fmt(b.startAt)}</strong>
                    {b.doctorName ? ` · ${b.doctorName}` : ''}
                    {b.status != null ? ` · وضعیت ${b.status}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="portal-patient__section">
            <h2>ویزیت و نسخه</h2>
            {visitList.length === 0 ? (
              <p className="portal-patient__hint">ویزیتی یافت نشد.</p>
            ) : (
              <ul className="portal-patient__list">
                {visitList.map((v, i) => (
                  <li key={v.appointmentId ?? i}>
                    <strong>{fmt(v.appointmentDate)}</strong>
                    {v.doctorName ? ` · ${v.doctorName}` : ''}
                    {v.appointmentStatus ? ` · ${v.appointmentStatus}` : ''}
                    {v.prescriptionNotes ? (
                      <div className="portal-patient__muted">{v.prescriptionNotes}</div>
                    ) : null}
                    {v.drugs && v.drugs.length > 0 && (
                      <div className="portal-patient__muted">
                        داروها:{' '}
                        {v.drugs
                          .map((d) => [d.drugName, d.dosage].filter(Boolean).join(' '))
                          .join('، ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
