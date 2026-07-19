import React, { useEffect, useState } from 'react';
import { environment } from '../../environments/environment';
import { patientMyHistory, type PortalMyHistory } from '../../api/portalApi';
import { PatientPagedList } from './PatientPagedList';

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

const STATUS_FA: Record<number, string> = {
  1: 'رزرو شده',
  2: 'لغو شده',
  3: 'جابه‌جا شده',
  4: 'انجام شده',
  5: 'حاضر نشد',
};

function statusTitle(status?: number, title?: string) {
  if (title?.trim()) return title;
  if (status != null && STATUS_FA[status]) return STATUS_FA[status];
  return status != null ? `وضعیت ${status}` : '';
}

function fileUrl(fileId?: string, link?: string | null) {
  if (fileId) {
    const base = (environment.fileApiUrl || '').replace(/\/?$/, '/');
    return `${base}Download/${fileId}`;
  }
  return link || '';
}

type Visit = NonNullable<PortalMyHistory['visits']>[number];
type Booking = NonNullable<PortalMyHistory['bookings']>[number];

export default function PatientHistoryPage() {
  const [data, setData] = useState<PortalMyHistory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openVisit, setOpenVisit] = useState<number | null>(null);

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
            <PatientPagedList
              items={bookingList}
              emptyText="رزروی یافت نشد."
              getKey={(b: Booking, i) => b.appointmentBookingId ?? i}
              renderItem={(b: Booking) => (
                <>
                  <strong>{fmt(b.startAt)}</strong>
                  {b.doctorName ? ` · ${b.doctorName}` : ''}
                  {(b.statusTitle || b.status != null) && (
                    <span
                      className={`portal-patient__badge${
                        b.status === 1
                          ? ' portal-patient__badge--ok'
                          : b.status === 2
                            ? ' portal-patient__badge--danger'
                            : ''
                      }`}
                    >
                      {statusTitle(b.status, b.statusTitle)}
                    </span>
                  )}
                </>
              )}
            />
          </section>

          <section className="portal-patient__section">
            <h2>ویزیت و نسخه</h2>
            <PatientPagedList
              items={visitList}
              emptyText="ویزیتی یافت نشد."
              getKey={(v: Visit, i) => v.appointmentId ?? i}
              renderItem={(v: Visit) => {
                const id = v.appointmentId ?? 0;
                const open = openVisit === id;
                return (
                  <div className={`portal-patient__accordion${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="portal-patient__accordion-head"
                      onClick={() => setOpenVisit(open ? null : id)}
                    >
                      <span>
                        <strong>{fmt(v.appointmentDate)}</strong>
                        {v.doctorName ? ` · ${v.doctorName}` : ''}
                        {v.appointmentStatus ? ` · ${v.appointmentStatus}` : ''}
                      </span>
                      <span className="portal-patient__accordion-chevron">{open ? '▲' : '▼'}</span>
                    </button>
                    {open && (
                      <div className="portal-patient__accordion-body">
                        {v.prescriptionNotes ? (
                          <p className="portal-patient__muted">یادداشت نسخه: {v.prescriptionNotes}</p>
                        ) : null}

                        {v.drugs && v.drugs.length > 0 && (
                          <div>
                            <strong>داروها</strong>
                            <ul className="portal-patient__sublist">
                              {v.drugs.map((d, i) => (
                                <li key={i}>
                                  {[d.drugName, d.dosage, d.usageInstructions].filter(Boolean).join(' · ')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {v.hasEchoReport && (
                          <div>
                            <strong>گزارش اکو</strong>
                            {v.echoConclusion ? (
                              <p className="portal-patient__muted">نتیجه: {v.echoConclusion}</p>
                            ) : (
                              <p className="portal-patient__muted">گزارش اکو ثبت شده است.</p>
                            )}
                            {v.echoRecommendation ? (
                              <p className="portal-patient__muted">توصیه: {v.echoRecommendation}</p>
                            ) : null}
                          </div>
                        )}

                        {v.labs && v.labs.length > 0 && (
                          <div>
                            <strong>آزمایش‌ها</strong>
                            <ul className="portal-patient__sublist">
                              {v.labs.map((l, i) => {
                                const url = fileUrl(l.attachmentId, l.attachmentLink);
                                return (
                                  <li key={i}>
                                    {l.labTestType || 'آزمایش'}
                                    {l.notes ? ` · ${l.notes}` : ''}
                                    {url ? (
                                      <>
                                        {' · '}
                                        <a href={url} target="_blank" rel="noreferrer">
                                          {l.attachmentFileName || 'مشاهده پیوست'}
                                        </a>
                                      </>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {v.imaging && v.imaging.length > 0 && (
                          <div>
                            <strong>تصویربرداری</strong>
                            <ul className="portal-patient__sublist">
                              {v.imaging.map((img, i) => {
                                const url = fileUrl(img.attachmentId, img.attachmentLink);
                                return (
                                  <li key={i}>
                                    {img.imageTypeName || 'تصویر'}
                                    {img.notes ? ` · ${img.notes}` : ''}
                                    {url ? (
                                      <>
                                        {' · '}
                                        <a href={url} target="_blank" rel="noreferrer">
                                          {img.attachmentFileName || 'مشاهده پیوست'}
                                        </a>
                                      </>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {!v.drugs?.length && !v.hasEchoReport && !v.labs?.length && !v.imaging?.length && !v.prescriptionNotes && (
                          <p className="portal-patient__hint">جزئیات بیشتری برای این ویزیت ثبت نشده است.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </section>
        </>
      )}
    </div>
  );
}
