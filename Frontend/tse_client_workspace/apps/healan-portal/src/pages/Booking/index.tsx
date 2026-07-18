import React, { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  bookingCancel,
  bookingCreate,
  bookingDoctors,
  bookingMyList,
  bookingOpenSlots,
  bookingProfileStatus,
  bookingReschedule,
  getPortalRagToken,
  type PortalBookingDoctor,
  type PortalBookingItem,
  type PortalOpenSlot,
} from '../../api/portalApi';
import { PortalAuthModal, resolveBookingEntry, type PortalAuthModalMode } from '../../components/PortalAuthModal';
import { callClinicPhone } from '../../constants';

const NOTE_MAX = 100;
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
      const appointmentSlotId = Number(pickField(raw, 'appointmentSlotId', 'AppointmentSlotId') ?? 0);
      const doctorId = Number(pickField(raw, 'doctorId', 'DoctorId') ?? 0);
      const startAt = String(pickField(raw, 'startAt', 'StartAt') ?? '');
      const endAt = String(pickField(raw, 'endAt', 'EndAt') ?? '');
      const doctorName = String(pickField(raw, 'doctorName', 'DoctorName') ?? '');
      return { appointmentSlotId, doctorId, startAt, endAt, doctorName } as PortalOpenSlot;
    })
    .filter((s) => s.appointmentSlotId > 0 && !!s.startAt)
    .slice(0, 120);
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

type View = 'loading' | 'book' | 'done';

export default function BookingPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('loading');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<PortalAuthModalMode>('register');
  const [doctors, setDoctors] = useState<PortalBookingDoctor[]>([]);
  const [slots, setSlots] = useState<PortalOpenSlot[]>([]);
  const [myBookings, setMyBookings] = useState<PortalBookingItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [rescheduleBookingId, setRescheduleBookingId] = useState(0);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    phoneNumber: '',
  });
  const [form, setForm] = useState({
    doctorId: 0,
    appointmentSlotId: 0,
    note: '',
  });
  const bootstrap = async () => {
    setError('');
    setView('loading');
    const entry = await resolveBookingEntry();
    if (entry.action === 'open-modal') {
      setAuthMode(entry.mode);
      if (entry.profile) {
        setProfile({
          firstName: entry.profile.firstName || '',
          lastName: entry.profile.lastName || '',
          nationalCode: entry.profile.nationalCode || '',
          phoneNumber: entry.profile.phoneNumber || '',
        });
      }
      setAuthOpen(true);
      return;
    }

    const status = entry.profile;
    setProfile({
      firstName: status.firstName || '',
      lastName: status.lastName || '',
      nationalCode: status.nationalCode || '',
      phoneNumber: status.phoneNumber || '',
    });
    setView('book');
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (view !== 'book') return;
    void bookingDoctors()
      .then((d) => {
        const docs = asArray<PortalBookingDoctor>(d);
        setDoctors(docs);
        if (docs.length === 1) {
          setForm((prev) => ({ ...prev, doctorId: Number(docs[0].doctorId) || 0 }));
        }
      })
      .catch(() => setError('بارگذاری اطلاعات نوبت‌دهی ناموفق بود.'));

    void bookingMyList()
      .then((mine) => setMyBookings(asArray<PortalBookingItem>(mine)))
      .catch(() => setMyBookings([]));
  }, [view]);
  useEffect(() => {
    if (view !== 'book') return;
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
  }, [view, form.doctorId]);

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

  const submitBook = async () => {
    setError('');
    setBusy(true);
    try {
      if (!getPortalRagToken()) throw new Error('جلسه منقضی شده است. دوباره وارد شوید.');
      if (!form.appointmentSlotId) throw new Error('یک نوبت آزاد انتخاب کنید.');
      const note = form.note.trim();
      if (note.length > NOTE_MAX) throw new Error(`دلیل مراجعه حداکثر ${NOTE_MAX} کاراکتر است.`);

      if (rescheduleBookingId > 0) {
        await bookingReschedule({
          appointmentBookingId: rescheduleBookingId,
          newAppointmentSlotId: form.appointmentSlotId,
        });
      } else {
        await bookingCreate({
          appointmentSlotId: form.appointmentSlotId,
          note: note || undefined,
        });
      }
      setView('done');
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'ثبت رزرو ناموفق بود'));
    } finally {
      setBusy(false);
    }
  };
  const cancelMine = async (id: number) => {
    setBusy(true);
    try {
      await bookingCancel({ appointmentBookingId: id });
      const mine = await bookingMyList();
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
          <span className="portal-booking__eyebrow">نوبت‌دهی آنلاین · build-v13-booking</span>
          <h1 className="portal-booking__title">انتخاب نوبت قلب</h1>
          <p className="portal-booking__lead">
            روز و ساعت مناسب را انتخاب کنید. پرداخت هنگام مراجعه به مطب انجام می‌شود.
          </p>
          {profile.phoneNumber && (
            <p className="portal-booking__hint" style={{ marginTop: 8 }}>
              بیمار: {profile.firstName} {profile.lastName} · {profile.phoneNumber}
            </p>
          )}
        </header>

        {error && <div className="portal-booking__error">{error}</div>}

        <PortalAuthModal
          open={authOpen}
          initialMode={authMode}
          prefill={profile}
          onClose={() => {
            setAuthOpen(false);
            if (view !== 'book' && view !== 'done') navigate('/');
          }}
          onSuccess={async (res) => {
            setProfile({
              firstName: res.firstName || '',
              lastName: res.lastName || '',
              nationalCode: res.nationalCode || '',
              phoneNumber: res.phoneNumber || '',
            });
            setAuthOpen(false);
            try {
              const status = await bookingProfileStatus();
              if (status?.isPatient) setView('book');
              else setView('book');
            } catch {
              setView('book');
            }
          }}
        />

        <BookingErrorBoundary onReset={() => void bootstrap()}>
          {view === 'loading' && !authOpen && (
            <div className="portal-booking__card">
              <p className="portal-booking__hint">در حال بررسی ورود…</p>
            </div>
          )}

          {view === 'book' && (
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
                <h3>{rescheduleBookingId ? 'انتخاب نوبت جدید' : 'انتخاب زمان مراجعه'}</h3>

                {!rescheduleBookingId && (
                  <div style={{ marginBottom: 12 }}>
                    <label className="portal-booking__label" htmlFor="booking-note">
                      دلیل مراجعه (اختیاری)
                    </label>
                    <textarea
                      id="booking-note"
                      className="portal-booking__input"
                      rows={3}
                      maxLength={NOTE_MAX}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value.slice(0, NOTE_MAX) })}
                      placeholder="در صورت تمایل دلیل مراجعه را بنویسید…"
                      style={{ resize: 'vertical', minHeight: 72 }}
                    />
                    <p className="portal-booking__hint" style={{ marginTop: 4 }}>
                      {form.note.length}/{NOTE_MAX}
                    </p>
                  </div>
                )}

                {doctors.length > 1 && (
                  <div style={{ marginBottom: 12 }}>
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

                <div>
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
                    {busy ? 'در حال ثبت…' : rescheduleBookingId ? 'ثبت جابجایی' : 'ثبت رزرو'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'done' && (
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
