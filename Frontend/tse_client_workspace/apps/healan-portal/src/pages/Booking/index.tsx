import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingCancel,
  bookingCreate,
  bookingDoctors,
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

type Step = 'phone' | 'otp' | 'book' | 'done';

function toAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - '۰'.charCodeAt(0)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - '٠'.charCodeAt(0)))
    .replace(/\D/g, '');
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const data = err as {
      data?: { errors?: string[]; title?: string; message?: string; Errors?: string[] };
    };
    const errors = data.data?.errors ?? data.data?.Errors;
    if (Array.isArray(errors) && errors[0]) return String(errors[0]);
    if (data.data?.message) return String(data.data.message);
    if (data.data?.title) return String(data.data.title);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

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

function stepClass(current: Step, target: Step): string {
  const order: Step[] = ['phone', 'otp', 'book', 'done'];
  const ci = order.indexOf(current);
  const ti = order.indexOf(target);
  if (ti < ci) return 'portal-booking__step is-done';
  if (ti === ci) return 'portal-booking__step is-active';
  return 'portal-booking__step';
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('phone');
  const [doctors, setDoctors] = useState<PortalBookingDoctor[]>([]);
  const [services, setServices] = useState<PortalBookingService[]>([]);
  const [slots, setSlots] = useState<PortalOpenSlot[]>([]);
  const [myBookings, setMyBookings] = useState<PortalBookingItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bookingToken, setBookingToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [patientKnown, setPatientKnown] = useState(false);
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
    void bookingOpenSlots({ doctorId: form.doctorId || undefined })
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

  const sendOtp = async () => {
    setError('');
    setBusy(true);
    try {
      const phone = toAsciiDigits(form.phoneNumber);
      if (phone.length !== 11 || !phone.startsWith('09')) {
        throw new Error('شماره موبایل معتبر نیست (مثال: 09123456789)');
      }
      setForm((prev) => ({ ...prev, phoneNumber: phone }));
      await bookingOtpRequest(phone);
      setOtpCode('');
      setStep('otp');
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'خطا در ارسال کد تأیید'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError('');
    setBusy(true);
    try {
      const phone = toAsciiDigits(form.phoneNumber);
      const code = toAsciiDigits(otpCode);
      if (code.length < 4) throw new Error('کد تأیید را کامل وارد کنید.');
      const res = await bookingOtpVerify({ phoneNumber: phone, code });
      setBookingToken(res.bookingToken);
      setForm((prev) => ({ ...prev, phoneNumber: res.phoneNumber || phone }));

      const patient = res.patient;
      if (patient?.found) {
        setPatientKnown(true);
        setForm((prev) => ({
          ...prev,
          firstName: patient.firstName || prev.firstName,
          lastName: patient.lastName || prev.lastName,
          nationalCode: toAsciiDigits(patient.nationalCode || '') || prev.nationalCode,
          phoneNumber: toAsciiDigits(patient.phoneNumber || '') || prev.phoneNumber,
        }));
      } else {
        setPatientKnown(false);
      }

      const mine = await bookingMyList(res.phoneNumber || phone);
      setMyBookings(mine ?? []);
      setStep('book');
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'کد تأیید نادرست است'));
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
      const national = toAsciiDigits(form.nationalCode);
      if (!form.firstName.trim() || !form.lastName.trim()) throw new Error('نام و نام خانوادگی لازم است.');
      if (national.length !== 10) throw new Error('کد ملی باید ۱۰ رقم باشد.');
      if (!form.appointmentSlotId) throw new Error('یک نوبت آزاد انتخاب کنید.');

      if (rescheduleBookingId > 0) {
        await bookingReschedule({
          bookingToken,
          appointmentBookingId: rescheduleBookingId,
          newAppointmentSlotId: form.appointmentSlotId,
          nationalCode: national,
          phoneNumber: form.phoneNumber,
        });
      } else {
        await bookingCreate({
          bookingToken,
          appointmentSlotId: form.appointmentSlotId,
          nationalCode: national,
          phoneNumber: form.phoneNumber,
          firstName: form.firstName,
          lastName: form.lastName,
          note: form.note,
          requestedServiceTypeIds: form.serviceTypeIds,
        });
      }
      setStep('done');
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'ثبت رزرو ناموفق بود'));
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
      setMyBookings(await bookingMyList(form.phoneNumber));
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'لغو ناموفق بود'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portal-booking">
      <div className="portal-booking__shell">
        <div className="portal-booking__nav">
          <Link to="/" className="portal-booking__back">
            ← بازگشت به سایت
          </Link>
          <button type="button" className="p-btn p-btn--outline p-btn--sm" onClick={callClinicPhone}>
            تماس تلفنی
          </button>
        </div>

        <header className="portal-booking__hero">
          <span className="portal-booking__eyebrow">نوبت‌دهی آنلاین · build-v7-booking</span>
          <h1 className="portal-booking__title">رزرو آنلاین نوبت قلب</h1>
          <p className="portal-booking__lead">
            فقط با شماره موبایل وارد شوید، کد پیامک را تأیید کنید، سپس زمان مناسب را انتخاب کنید. پرداخت هنگام مراجعه به مطب انجام می‌شود.
          </p>
        </header>

        <div className="portal-booking__steps" aria-hidden>
          <div className={stepClass(step, 'phone')}>۱. موبایل</div>
          <div className={stepClass(step, 'otp')}>۲. کد تأیید</div>
          <div className={stepClass(step, 'book')}>۳. انتخاب نوبت</div>
          <div className={stepClass(step, 'done')}>۴. ثبت</div>
        </div>

        {error && <div className="portal-booking__error">{error}</div>}

        {step === 'phone' && (
          <div className="portal-booking__card">
            <label className="portal-booking__label" htmlFor="booking-phone">
              شماره موبایل
            </label>
            <input
              id="booking-phone"
              className="portal-booking__input"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: toAsciiDigits(e.target.value).slice(0, 11) })}
              placeholder="09123456789"
            />
            <p className="portal-booking__hint">کد تأیید فقط به همین شماره پیامک می‌شود.</p>
            <div className="portal-booking__actions">
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--primary"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                {busy ? 'در حال ارسال…' : 'دریافت کد تأیید'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="portal-booking__card">
            <p className="portal-booking__hint" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
              کد پیامک‌شده به <strong>{form.phoneNumber}</strong> را وارد کنید.
            </p>
            <label className="portal-booking__label" htmlFor="booking-otp">
              کد تأیید
            </label>
            <input
              id="booking-otp"
              className="portal-booking__input portal-booking__input--otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(toAsciiDigits(e.target.value).slice(0, 6))}
              placeholder="------"
            />
            <div className="portal-booking__actions">
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--green"
                disabled={busy}
                onClick={() => void verify()}
              >
                {busy ? 'در حال بررسی…' : 'تأیید'}
              </button>
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--outline"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                ارسال مجدد
              </button>
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--ghost"
                disabled={busy}
                onClick={() => setStep('phone')}
              >
                تغییر شماره
              </button>
            </div>
          </div>
        )}

        {step === 'book' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myBookings.length > 0 && (
              <div className="portal-booking__card">
                <h3>رزروهای فعال شما</h3>
                {myBookings.map((b) => (
                  <div key={b.appointmentBookingId} className="portal-booking__mine-item">
                    <div>{formatSlot(b.startAt)}</div>
                    <div style={{ color: 'var(--p-muted)', fontSize: '0.88rem' }}>{b.doctorName}</div>
                    <div className="portal-booking__actions" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="portal-booking__btn portal-booking__btn--outline"
                        onClick={() => {
                          setRescheduleBookingId(b.appointmentBookingId);
                          setForm((prev) => ({ ...prev, appointmentSlotId: 0, doctorId: b.doctorId }));
                        }}
                      >
                        جابجایی
                      </button>
                      <button
                        type="button"
                        className="portal-booking__btn portal-booking__btn--ghost"
                        onClick={() => void cancelMine(b.appointmentBookingId)}
                      >
                        لغو
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="portal-booking__card">
              <h3>{rescheduleBookingId ? 'انتخاب نوبت جدید' : 'اطلاعات بیمار و نوبت'}</h3>
              {!rescheduleBookingId && (
                <>
                  {patientKnown && (
                    <div className="portal-booking__success-banner">اطلاعات شما از پرونده قبلی پر شد.</div>
                  )}
                  <div className="portal-booking__grid-2">
                    <div>
                      <label className="portal-booking__label">نام</label>
                      <input
                        className="portal-booking__input"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="portal-booking__label">نام خانوادگی</label>
                      <input
                        className="portal-booking__input"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label className="portal-booking__label">کد ملی</label>
                    <input
                      className="portal-booking__input"
                      inputMode="numeric"
                      value={form.nationalCode}
                      onChange={(e) => setForm({ ...form, nationalCode: toAsciiDigits(e.target.value).slice(0, 10) })}
                      placeholder="0012345678"
                    />
                  </div>
                  {services.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <label className="portal-booking__label">عنوان خدمت درخواستی (اختیاری)</label>
                      <div className="portal-booking__services">
                        {services.map((s) => (
                          <label key={s.serviceTypeId} className="portal-booking__chip">
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
                  )}
                </>
              )}

              {doctors.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <label className="portal-booking__label">پزشک</label>
                  <select
                    className="portal-booking__input"
                    value={form.doctorId}
                    onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value), appointmentSlotId: 0 })}
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
                <label className="portal-booking__label">زمان‌های آزاد</label>
                {groupedSlots.length === 0 ? (
                  <p className="portal-booking__hint">نوبت آزادی در روزهای آینده ثبت نشده است.</p>
                ) : (
                  groupedSlots.map(([day, daySlots]) => (
                    <div key={day} className="portal-booking__slots-day">
                      <strong>{formatSlot(daySlots[0].startAt).split('،')[0]}</strong>
                      <div className="portal-booking__slot-grid">
                        {daySlots.map((slot) => (
                          <button
                            key={slot.appointmentSlotId}
                            type="button"
                            className={`portal-booking__slot${
                              form.appointmentSlotId === slot.appointmentSlotId ? ' is-selected' : ''
                            }`}
                            onClick={() => setForm({ ...form, appointmentSlotId: slot.appointmentSlotId })}
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

              <div className="portal-booking__actions">
                <button
                  type="button"
                  className="portal-booking__btn portal-booking__btn--green"
                  disabled={busy}
                  onClick={() => void submitBook()}
                >
                  {busy ? '…' : rescheduleBookingId ? 'ثبت جابجایی' : 'ثبت رزرو'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="portal-booking__card portal-booking__done">
            <h2>رزرو شما ثبت شد</h2>
            <p className="portal-booking__hint">لطفاً در موعد مقرر در مطب حاضر شوید. پرداخت در محل انجام می‌شود.</p>
            <div className="portal-booking__actions" style={{ justifyContent: 'center' }}>
              <Link to="/" className="portal-booking__btn portal-booking__btn--primary">
                بازگشت به صفحه اصلی
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
