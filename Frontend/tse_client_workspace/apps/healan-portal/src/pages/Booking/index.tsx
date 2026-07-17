import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingCancel,
  bookingCreate,
  bookingDoctors,
  bookingLookupPatient,
  bookingMyList,
  bookingOpenSlots,
  bookingOtpRequest,
  bookingOtpVerify,
  bookingReschedule,
  bookingServices,
  type PortalBookingDoctor,
  type PortalBookingItem,
  type PortalBookingService,
  type PortalOpenSlot,
} from '../../api/portalApi';
import { callClinicPhone } from '../../constants';

type Step = 'identity' | 'otp' | 'book' | 'done';

function formatSlot(iso: string) {
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('identity');
  const [doctors, setDoctors] = useState<PortalBookingDoctor[]>([]);
  const [services, setServices] = useState<PortalBookingService[]>([]);
  const [slots, setSlots] = useState<PortalOpenSlot[]>([]);
  const [myBookings, setMyBookings] = useState<PortalBookingItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookingToken, setBookingToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [form, setForm] = useState({
    nationalCode: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    doctorId: 0,
    appointmentSlotId: 0,
    note: '',
    serviceTypeIds: [] as number[],
  });
  const [rescheduleBookingId, setRescheduleBookingId] = useState(0);

  useEffect(() => {
    Promise.all([bookingDoctors(), bookingServices()])
      .then(([d, s]) => {
        setDoctors(d ?? []);
        setServices(s ?? []);
        if ((d ?? []).length === 1) {
          setForm((prev) => ({ ...prev, doctorId: d[0].doctorId }));
        }
      })
      .catch(() => setError('بارگذاری اطلاعات نوبت‌دهی ناموفق بود.'));
  }, []);

  useEffect(() => {
    if (step !== 'book') return;
    void bookingOpenSlots({
      doctorId: form.doctorId || undefined,
    })
      .then((list) => setSlots(list ?? []))
      .catch(() => setSlots([]));
  }, [step, form.doctorId]);

  const groupedSlots = useMemo(() => {
    const map = new Map<string, PortalOpenSlot[]>();
    for (const slot of slots) {
      const day = slot.startAt.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(slot);
      map.set(day, list);
    }
    return [...map.entries()];
  }, [slots]);

  const lookup = async () => {
    setError('');
    setBusy(true);
    try {
      const national = form.nationalCode.trim();
      if (national.length !== 10) throw new Error('کد ملی باید ۱۰ رقم باشد.');
      const found = await bookingLookupPatient(national);
      if (found.found) {
        setForm((prev) => ({
          ...prev,
          firstName: found.firstName ?? prev.firstName,
          lastName: found.lastName ?? prev.lastName,
          phoneNumber: found.phoneNumber ?? prev.phoneNumber,
        }));
      }
      if (!form.phoneNumber && !found.phoneNumber) {
        setError('شماره موبایل را وارد کنید.');
        return;
      }
      const phone = (found.phoneNumber || form.phoneNumber).trim();
      setForm((prev) => ({ ...prev, phoneNumber: phone }));
      await bookingOtpRequest(phone);
      setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا در ارسال کد تأیید');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await bookingOtpVerify({
        phoneNumber: form.phoneNumber,
        code: otpCode,
        nationalCode: form.nationalCode,
      });
      setBookingToken(res.bookingToken);
      const mine = await bookingMyList(form.nationalCode, form.phoneNumber);
      setMyBookings(mine ?? []);
      setStep('book');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'کد تأیید نادرست است');
    } finally {
      setBusy(false);
    }
  };

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  const submitBook = async () => {
    setError('');
    setBusy(true);
    try {
      if (!form.firstName.trim() || !form.lastName.trim()) throw new Error('نام و نام خانوادگی لازم است.');
      if (!form.appointmentSlotId) throw new Error('یک نوبت آزاد انتخاب کنید.');

      if (rescheduleBookingId > 0) {
        await bookingReschedule({
          bookingToken,
          appointmentBookingId: rescheduleBookingId,
          newAppointmentSlotId: form.appointmentSlotId,
          nationalCode: form.nationalCode,
          phoneNumber: form.phoneNumber,
        });
      } else {
        await bookingCreate({
          bookingToken,
          appointmentSlotId: form.appointmentSlotId,
          nationalCode: form.nationalCode,
          phoneNumber: form.phoneNumber,
          firstName: form.firstName,
          lastName: form.lastName,
          note: form.note,
          requestedServiceTypeIds: form.serviceTypeIds,
        });
      }
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'ثبت رزرو ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  const cancelMine = async (id: number) => {
    setBusy(true);
    try {
      await bookingCancel({
        bookingToken,
        appointmentBookingId: id,
        nationalCode: form.nationalCode,
        phoneNumber: form.phoneNumber,
      });
      setMyBookings(await bookingMyList(form.nationalCode, form.phoneNumber));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'لغو ناموفق بود');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portal-page" style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f0f9ff,#fff)', padding: '1.5rem 1rem 3rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 600 }}>
            ← بازگشت به سایت
          </Link>
          <button type="button" className="p-btn p-btn--outline p-btn--sm" onClick={callClinicPhone}>
            تماس تلفنی
          </button>
        </div>

        <h1 style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif', fontSize: '1.75rem', marginBottom: 8, color: '#0f172a' }}>
          رزرو نوبت آنلاین
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          فقط نوبت پزشکان قلب. پرداخت در مطب انجام می‌شود.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {step === 'identity' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>کد ملی</label>
            <input
              value={form.nationalCode}
              onChange={(e) => setForm({ ...form, nationalCode: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8 }}
              placeholder="۰۰۱۲۳۴۵۶۷۸"
            />
            <label style={{ display: 'block', marginBottom: 6 }}>موبایل (اگر بیمار جدید هستید)</label>
            <input
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8 }}
              placeholder="0912…"
            />
            <button type="button" className="p-btn p-btn--primary" disabled={busy} onClick={() => void lookup()}>
              {busy ? '…' : 'ادامه و دریافت کد تأیید'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <p style={{ marginBottom: 12 }}>کد پیامک‌شده به {form.phoneNumber} را وارد کنید.</p>
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ width: '100%', padding: 10, marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8, letterSpacing: 4, fontSize: 20 }}
              placeholder="------"
            />
            <button type="button" className="p-btn p-btn--primary" disabled={busy} onClick={() => void verify()}>
              تأیید
            </button>
          </div>
        )}

        {step === 'book' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myBookings.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem' }}>
                <h3 style={{ marginTop: 0 }}>رزروهای فعال شما</h3>
                {myBookings.map((b) => (
                  <div key={b.appointmentBookingId} style={{ borderBottom: '1px solid #e2e8f0', padding: '0.75rem 0' }}>
                    <div>{formatSlot(b.startAt)}</div>
                    <div style={{ color: '#64748b' }}>{b.doctorName}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="p-btn p-btn--outline p-btn--sm"
                        onClick={() => {
                          setRescheduleBookingId(b.appointmentBookingId);
                          setForm((prev) => ({ ...prev, appointmentSlotId: 0, doctorId: b.doctorId }));
                        }}
                      >
                        جابجایی
                      </button>
                      <button
                        type="button"
                        className="p-btn p-btn--ghost p-btn--sm"
                        onClick={() => void cancelMine(b.appointmentBookingId)}
                      >
                        لغو
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem' }}>
              <h3 style={{ marginTop: 0 }}>{rescheduleBookingId ? 'انتخاب نوبت جدید' : 'اطلاعات بیمار و نوبت'}</h3>
              {!rescheduleBookingId && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label>نام</label>
                      <input
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <label>نام خانوادگی</label>
                      <input
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label>عنوان خدمت درخواستی (اختیاری)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {services.map((s) => (
                        <label key={s.serviceTypeId} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={form.serviceTypeIds.includes(s.serviceTypeId)}
                            onChange={() => toggleService(s.serviceTypeId)}
                          />
                          {s.title}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {doctors.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <label>پزشک</label>
                  <select
                    value={form.doctorId}
                    onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value), appointmentSlotId: 0 })}
                    style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}
                  >
                    <option value={0}>همه</option>
                    {doctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label>اسلات‌های آزاد</label>
                {groupedSlots.length === 0 ? (
                  <p style={{ color: '#64748b' }}>نوبت آزادی در روزهای آینده نیست.</p>
                ) : (
                  groupedSlots.map(([day, daySlots]) => (
                    <div key={day} style={{ marginTop: 10 }}>
                      <strong>{formatSlot(daySlots[0].startAt).split('،')[0]}</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {daySlots.map((slot) => (
                          <button
                            key={slot.appointmentSlotId}
                            type="button"
                            onClick={() => setForm({ ...form, appointmentSlotId: slot.appointmentSlotId })}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border:
                                form.appointmentSlotId === slot.appointmentSlotId
                                  ? '2px solid #0f766e'
                                  : '1px solid #cbd5e1',
                              background: form.appointmentSlotId === slot.appointmentSlotId ? '#ccfbf1' : '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {new Date(slot.startAt).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="p-btn p-btn--primary"
                style={{ marginTop: 16 }}
                disabled={busy}
                onClick={() => void submitBook()}
              >
                {busy ? '…' : rescheduleBookingId ? 'ثبت جابجایی' : 'ثبت رزرو'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ color: '#0f766e' }}>رزرو شما ثبت شد</h2>
            <p style={{ color: '#64748b' }}>لطفاً در موعد مقرر در مطب حاضر شوید. پرداخت در محل انجام می‌شود.</p>
            <Link to="/" className="p-btn p-btn--primary" style={{ display: 'inline-block', marginTop: 12 }}>
              بازگشت به صفحه اصلی
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
