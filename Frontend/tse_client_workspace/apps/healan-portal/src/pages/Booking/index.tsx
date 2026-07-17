import React, { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react';
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

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj['items'])) return obj['items'] as T[];
    if (Array.isArray(obj['data'])) return obj['data'] as T[];
    if (Array.isArray(obj['result'])) return obj['result'] as T[];
  }
  return [];
}

/** Case-insensitive nested field lookup for API payloads. */
function pickField(source: unknown, ...names: string[]): unknown {
  if (!source || typeof source !== 'object') return undefined;
  const obj = source as Record<string, unknown>;
  const lower = names.map((n) => n.toLowerCase());
  for (const [key, val] of Object.entries(obj)) {
    if (lower.includes(key.toLowerCase()) && val != null && val !== '') return val;
  }
  for (const nestKey of ['data', 'result', 'value', 'Data', 'Result', 'Value']) {
    const nested = obj[nestKey];
    if (nested && typeof nested === 'object') {
      const found = pickField(nested, ...names);
      if (found != null && found !== '') return found;
    }
  }
  return undefined;
}

function slotDayKey(startAt: unknown): string {
  const raw = String(startAt ?? '');
  const m = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
  } catch {
    // ignore
  }
  return '';
}

function normalizeOpenSlots(list: unknown): PortalOpenSlot[] {
  return asArray<Record<string, unknown>>(list)
    .map((raw) => {
      const appointmentSlotId = Number(
        pickField(raw, 'appointmentSlotId', 'AppointmentSlotId') ?? 0
      );
      const doctorId = Number(pickField(raw, 'doctorId', 'DoctorId') ?? 0);
      const startAt = String(pickField(raw, 'startAt', 'StartAt') ?? '');
      const endAt = String(pickField(raw, 'endAt', 'EndAt') ?? '');
      const doctorName = String(pickField(raw, 'doctorName', 'DoctorName') ?? '');
      return { appointmentSlotId, doctorId, startAt, endAt, doctorName } as PortalOpenSlot;
    })
    .filter((s) => s.appointmentSlotId > 0 && !!s.startAt)
    .slice(0, 120);
}

function toAsciiDigits(value: unknown): string {
  return String(value ?? '')
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

function formatSlot(iso: unknown) {
  if (iso == null || iso === '') return '—';
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function formatSlotTime(iso: unknown) {
  if (iso == null || iso === '') return '—';
  try {
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso);
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

class BookingErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; message: string }
> {
  override state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'خطای نمایش' };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Booking page crash', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="portal-booking__card">
          <h3>مشکلی در نمایش مرحله رزرو پیش آمد</h3>
          <p className="portal-booking__hint">{this.state.message || 'لطفاً دوباره تلاش کنید.'}</p>
          <div className="portal-booking__actions">
            <button
              type="button"
              className="portal-booking__btn portal-booking__btn--primary"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                this.props.onReset?.();
              }}
            >
              بازگشت به شروع
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
  const [selectedDay, setSelectedDay] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('healan_booking_session');
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        bookingToken?: string;
        phoneNumber?: string;
        step?: Step;
        firstName?: string;
        lastName?: string;
        nationalCode?: string;
      };
      if (!saved?.bookingToken || !saved.phoneNumber) return;
      setBookingToken(saved.bookingToken);
      setForm((prev) => ({
        ...prev,
        phoneNumber: saved.phoneNumber || prev.phoneNumber,
        firstName: saved.firstName || prev.firstName,
        lastName: saved.lastName || prev.lastName,
        nationalCode: saved.nationalCode || prev.nationalCode,
      }));
      if (saved.step === 'book' || saved.step === 'done') setStep(saved.step);
    } catch {
      // ignore corrupt session
    }
  }, []);

  useEffect(() => {
    Promise.all([bookingDoctors(), bookingServices()])
      .then(([d, s]) => {
        const docs = asArray<PortalBookingDoctor>(d);
        const svcs = asArray<PortalBookingService>(s);
        setDoctors(docs);
        setServices(svcs);
        if (docs.length === 1) {
          setForm((prev) => ({ ...prev, doctorId: Number(docs[0].doctorId) || 0 }));
        }
      })
      .catch(() => setError('بارگذاری اطلاعات نوبت‌دهی ناموفق بود.'));
  }, []);

  useEffect(() => {
    if (step !== 'book') return;
    let cancelled = false;
    setSlots([]);
    setSelectedDay('');
    setSlotsLoading(true);
    void bookingOpenSlots({ doctorId: form.doctorId || undefined })
      .then((list) => {
        if (cancelled) return;
        const next = normalizeOpenSlots(list);
        setSlots(next);
        setSelectedDay(slotDayKey(next[0]?.startAt));
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setSelectedDay('');
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, form.doctorId]);

  const dayOptions = useMemo(() => {
    const days: string[] = [];
    for (const slot of slots) {
      const day = slotDayKey(slot?.startAt);
      if (day && !days.includes(day)) days.push(day);
    }
    return days;
  }, [slots]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [] as PortalOpenSlot[];
    return slots.filter((s) => slotDayKey(s?.startAt) === selectedDay);
  }, [slots, selectedDay]);

  const persistSession = (next: {
    bookingToken: string;
    phoneNumber: string;
    step: Step;
    firstName?: string;
    lastName?: string;
    nationalCode?: string;
  }) => {
    try {
      sessionStorage.setItem('healan_booking_session', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const resetToPhone = () => {
    setStep('phone');
    setError('');
    setOtpCode('');
    setBookingToken('');
    setMyBookings([]);
    setSlots([]);
    setSelectedDay('');
    setRescheduleBookingId(0);
    try {
      sessionStorage.removeItem('healan_booking_session');
    } catch {
      // ignore
    }
  };

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
      const token = String(pickField(res, 'bookingToken', 'BookingToken') ?? '');
      if (!token) throw new Error('تأیید انجام نشد. دوباره تلاش کنید.');

      // Enter step 3 immediately — never wait on myList / patient parsing.
      setBookingToken(token);
      setStep('book');
      setBusy(false);

      const verifiedPhone =
        toAsciiDigits(pickField(res, 'phoneNumber', 'PhoneNumber') ?? phone) || phone;
      const patient = (pickField(res, 'patient', 'Patient') ?? undefined) as
        | Record<string, unknown>
        | undefined;
      const known = pickField(patient, 'found', 'Found') === true;
      const nextForm = {
        ...form,
        phoneNumber: verifiedPhone,
        firstName: known
          ? String(pickField(patient, 'firstName', 'FirstName') ?? form.firstName)
          : form.firstName,
        lastName: known
          ? String(pickField(patient, 'lastName', 'LastName') ?? form.lastName)
          : form.lastName,
        nationalCode: known
          ? toAsciiDigits(pickField(patient, 'nationalCode', 'NationalCode') ?? '') ||
            form.nationalCode
          : form.nationalCode,
      };

      setForm(nextForm);
      setPatientKnown(known);
      persistSession({
        bookingToken: token,
        phoneNumber: verifiedPhone,
        step: 'book',
        firstName: nextForm.firstName,
        lastName: nextForm.lastName,
        nationalCode: nextForm.nationalCode,
      });

      void bookingMyList(verifiedPhone)
        .then((mine) => setMyBookings(asArray<PortalBookingItem>(mine)))
        .catch(() => setMyBookings([]));
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'کد تأیید نادرست است'));
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
      persistSession({
        bookingToken,
        phoneNumber: form.phoneNumber,
        step: 'done',
        firstName: form.firstName,
        lastName: form.lastName,
        nationalCode: form.nationalCode,
      });
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
      const mine = await bookingMyList(form.phoneNumber);
      setMyBookings(asArray<PortalBookingItem>(mine));
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
          <span className="portal-booking__eyebrow">نوبت‌دهی آنلاین · build-v10-booking</span>
          <h1 className="portal-booking__title">رزرو آنلاین نوبت قلب</h1>
          <p className="portal-booking__lead">
            فقط با شماره موبایل وارد شوید، کد پیامک را تأیید کنید، سپس زمان مناسب را انتخاب کنید. پرداخت هنگام مراجعه به
            مطب انجام می‌شود.
          </p>
        </header>

        <div className="portal-booking__steps" aria-hidden>
          <div className={stepClass(step, 'phone')}>۱. موبایل</div>
          <div className={stepClass(step, 'otp')}>۲. کد تأیید</div>
          <div className={stepClass(step, 'book')}>۳. انتخاب نوبت</div>
          <div className={stepClass(step, 'done')}>۴. ثبت</div>
        </div>

        {error && <div className="portal-booking__error">{error}</div>}

        <BookingErrorBoundary onReset={resetToPhone}>
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
                  {myBookings.map((b, idx) => (
                    <div key={b.appointmentBookingId || idx} className="portal-booking__mine-item">
                      <div>{formatSlot(b.startAt)}</div>
                      <div style={{ color: 'var(--p-muted)', fontSize: '0.88rem' }}>{b.doctorName || '—'}</div>
                      <div className="portal-booking__actions" style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="portal-booking__btn portal-booking__btn--outline"
                          onClick={() => {
                            setRescheduleBookingId(Number(b.appointmentBookingId) || 0);
                            setForm((prev) => ({
                              ...prev,
                              appointmentSlotId: 0,
                              doctorId: Number(b.doctorId) || 0,
                            }));
                          }}
                        >
                          جابجایی
                        </button>
                        <button
                          type="button"
                          className="portal-booking__btn portal-booking__btn--ghost"
                          onClick={() => void cancelMine(Number(b.appointmentBookingId))}
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
                        onChange={(e) =>
                          setForm({ ...form, nationalCode: toAsciiDigits(e.target.value).slice(0, 10) })
                        }
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
                                checked={form.serviceTypeIds.includes(Number(s.serviceTypeId))}
                                onChange={() => toggleService(Number(s.serviceTypeId))}
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
                      onChange={(e) =>
                        setForm({ ...form, doctorId: Number(e.target.value), appointmentSlotId: 0 })
                      }
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
                  <label className="portal-booking__label">روز نوبت</label>
                  {slotsLoading ? (
                    <p className="portal-booking__hint">در حال بارگذاری نوبت‌های آزاد…</p>
                  ) : dayOptions.length === 0 ? (
                    <p className="portal-booking__hint">نوبت آزادی در روزهای آینده ثبت نشده است.</p>
                  ) : (
                    <>
                      <select
                        className="portal-booking__input"
                        value={selectedDay}
                        onChange={(e) => {
                          setSelectedDay(e.target.value);
                          setForm((prev) => ({ ...prev, appointmentSlotId: 0 }));
                        }}
                      >
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {formatSlot(`${day}T12:00:00`).split(/[،,]/)[0] || day}
                          </option>
                        ))}
                      </select>
                      <label className="portal-booking__label" style={{ marginTop: 12 }}>
                        ساعت‌های آزاد این روز
                      </label>
                      <div className="portal-booking__slot-grid">
                        {daySlots.map((slot) => (
                          <button
                            key={slot.appointmentSlotId}
                            type="button"
                            className={`portal-booking__slot${
                              form.appointmentSlotId === Number(slot.appointmentSlotId)
                                ? ' is-selected'
                                : ''
                            }`}
                            onClick={() =>
                              setForm({
                                ...form,
                                appointmentSlotId: Number(slot.appointmentSlotId) || 0,
                              })
                            }
                          >
                            {formatSlotTime(slot.startAt)}
                          </button>
                        ))}
                      </div>
                    </>
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
              <p className="portal-booking__hint">
                لطفاً در موعد مقرر در مطب حاضر شوید. پرداخت در محل انجام می‌شود.
              </p>
              <div className="portal-booking__actions" style={{ justifyContent: 'center' }}>
                <Link to="/" className="portal-booking__btn portal-booking__btn--primary">
                  بازگشت به صفحه اصلی
                </Link>
              </div>
            </div>
          )}
        </BookingErrorBoundary>
      </div>
    </div>
  );
}
