import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  bookingCancel,
  bookingCreate,
  bookingMyList,
  bookingOpenSlots,
  bookingReschedule,
  fetchRagAnswer,
  fetchRagQuota,
  getPortalRagToken,
  requestRagOtp,
  setPortalRagToken,
  verifyRagOtp,
  type PortalBookingItem,
  type PortalOpenSlot,
  type RagQuotaStatus,
} from '../../api/portalApi';
import { PortalAuthModal, resolveBookingEntry, type PortalAuthModalMode } from '../../components/PortalAuthModal';
import {
  apiErrorMessage,
  formatSlotFull,
  formatSlotTime,
  isActiveBookingStatus,
  normalizeBookings,
  normalizeOpenSlots,
  slotDayKey,
} from './bookingHelpers';
import {
  formatDayLabelFa,
  parseBookingIntent,
  slotMatchesTime,
  toDayKey,
  todayLocalDate,
  type BookingIntent,
} from './bookingIntent';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  bookingUi?: {
    type: 'slots' | 'my_bookings' | 'confirm_cancel';
    dayKey?: string;
    slots?: PortalOpenSlot[];
    bookings?: PortalBookingItem[];
    pendingCancelId?: number;
    rescheduleBookingId?: number;
  };
}

const SUGGESTIONS = [
  'نوبت‌های امروز',
  'نوبت‌های فردا',
  'نوبت‌های ۳۱ تیر',
  'نوبت‌های من',
  'آدرس مطب کجاست؟',
];

const WELCOME =
  'سلام! من دستیار هوشمند مطب دکتر شهرویی هستم. می‌توانید درباره آدرس و خدمات بپرسید، بگویید «نوبت‌های فردا» یا تاریخ شمسی مثل «نوبت‌های ۳۱ تیر ۱۴۰۵» تا ساعات آزاد را ببینید.';

const GUEST_COOKIE = 'healan_rag_guest';
const OTP_TTL_SECONDS = 120;

const BTN_PRIMARY: React.CSSProperties = {
  backgroundColor: '#ffe8ec',
  backgroundImage: 'none',
  color: '#c6283a',
  border: '1.5px solid rgba(239, 57, 78, 0.4)',
  borderRadius: 12,
  padding: '0.65rem 1.15rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(239, 57, 78, 0.12)',
};

const BTN_GHOST: React.CSSProperties = {
  backgroundColor: '#e8ebf2',
  backgroundImage: 'none',
  color: '#23254e',
  border: '1.5px solid rgba(35, 37, 78, 0.12)',
  borderRadius: 12,
  padding: '0.65rem 1.15rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const BTN_LOGIN_PILL: React.CSSProperties = {
  backgroundColor: '#ffe8ec',
  backgroundImage: 'none',
  color: '#c6283a',
  border: '1.5px solid rgba(239, 57, 78, 0.4)',
  borderRadius: 999,
  padding: '0.45rem 1rem',
  fontWeight: 700,
  fontSize: '0.88rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(239, 57, 78, 0.12)',
  whiteSpace: 'nowrap',
};

const CHIP: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#23254e',
  border: '1.5px solid rgba(239, 57, 78, 0.35)',
  borderRadius: 999,
  padding: '0.4rem 0.85rem',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

function RobotIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="12" y="16" width="24" height="20" rx="7" fill="#19bfd3" />
      <rect x="15" y="19" width="18" height="12" rx="5" fill="#e8f9fc" />
      <circle cx="20.5" cy="25" r="2.4" fill="#23254e" />
      <circle cx="27.5" cy="25" r="2.4" fill="#23254e" />
      <circle cx="20.5" cy="25" r="0.9" fill="#7dd3e0" />
      <circle cx="27.5" cy="25" r="0.9" fill="#7dd3e0" />
      <path d="M22.2 29.2h3.6" stroke="#0f766e" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="21.5" y="9" width="5" height="5" rx="2" fill="#ef394e" />
      <path d="M24 9V6.5" stroke="#ef394e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="5.2" r="1.5" fill="#ef394e" />
      <path d="M12 24H8.5a2 2 0 0 1 0-4H12" fill="#19bfd3" />
      <path d="M36 24h3.5a2 2 0 0 0 0-4H36" fill="#19bfd3" />
      <rect x="17" y="36" width="5" height="4" rx="2" fill="#0f766e" />
      <rect x="26" y="36" width="5" height="4" rx="2" fill="#0f766e" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="18" fill="#ef394e" opacity="0.12" />
      <circle cx="24" cy="18" r="7" fill="#ef394e" />
      <circle cx="24" cy="18" r="4.2" fill="#ffd6de" />
      <path d="M10.5 38.5c2.8-7.2 8.2-10.5 13.5-10.5S34.7 31.3 37.5 38.5" fill="#ef394e" />
      <path d="M14 37c2.2-5 6.2-7.2 10-7.2s7.8 2.2 10 7.2" fill="#c6283a" opacity="0.35" />
    </svg>
  );
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sess-${Date.now()}`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function ensureGuestKey(): string {
  let key = readCookie(GUEST_COOKIE);
  if (!key) {
    key = createSessionId();
    writeCookie(GUEST_COOKIE, key);
  }
  return key;
}

function tokenizeForStream(text: string): string[] {
  const parts = text.match(/\S+\s*/g);
  return parts && parts.length > 0 ? parts : [text];
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function resolveDayKey(intent: BookingIntent): string {
  if (intent.dayKey) return intent.dayKey;
  return toDayKey(todayLocalDate());
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [quota, setQuota] = useState<RagQuotaStatus | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bookingAuthOpen, setBookingAuthOpen] = useState(false);
  const [bookingAuthMode, setBookingAuthMode] = useState<PortalAuthModalMode>('register');
  const [bookingBusy, setBookingBusy] = useState(false);

  const sessionIdRef = useRef(createSessionId());
  const guestKeyRef = useRef(ensureGuestKey());
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const streamCancelRef = useRef(false);
  const otpExpireAtRef = useRef<number>(0);
  const hasScrolledRef = useRef(false);
  const pendingIntentRef = useRef<BookingIntent | null>(null);
  const rescheduleIdRef = useRef<number>(0);

  const busy = loading || streaming || bookingBusy;
  const emptyChat = messages.length <= 1 && !busy;
  const showSuggestions = emptyChat;
  const blocked = !!quota?.requiresLogin && !quota.isAuthenticated;

  const focusInput = () => {
    const apply = () => {
      const el = textareaRef.current;
      if (!el || el.disabled) return;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        /* ignore */
      }
    };
    window.requestAnimationFrame(() => {
      apply();
      window.setTimeout(apply, 0);
      window.setTimeout(apply, 60);
    });
  };

  const scrollMessagesToBottom = (smooth = true) => {
    const el = messagesRef.current;
    if (!el) return;
    if (smooth && !prefersReducedMotion()) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  const refreshQuota = async () => {
    try {
      const status = await fetchRagQuota(guestKeyRef.current);
      setQuota(status);
      return status;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    void refreshQuota();
    focusInput();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.height = '100%';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
    };
  }, []);

  useEffect(() => {
    if (emptyChat) {
      if (messagesRef.current) messagesRef.current.scrollTop = 0;
      return;
    }
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
      scrollMessagesToBottom(false);
      return;
    }
    scrollMessagesToBottom(true);
  }, [messages, loading, streaming, emptyChat, bookingBusy]);

  useEffect(() => {
    return () => {
      streamCancelRef.current = true;
      if (streamTimerRef.current != null) window.clearTimeout(streamTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!otpSent || otpExpireAtRef.current <= 0) return;
    const tick = () => {
      const left = Math.ceil((otpExpireAtRef.current - Date.now()) / 1000);
      setOtpSecondsLeft(Math.max(0, left));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [otpSent]);

  useEffect(() => {
    if (!busy && !blocked && !loginOpen && !bookingAuthOpen) focusInput();
  }, [busy, blocked, loginOpen, bookingAuthOpen]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const startOtpTimer = (expiresInSeconds: number) => {
    const seconds = expiresInSeconds > 0 ? expiresInSeconds : OTP_TTL_SECONDS;
    otpExpireAtRef.current = Date.now() + seconds * 1000;
    setOtpSecondsLeft(seconds);
    setOtpSent(true);
  };

  const pushAssistant = (text: string, bookingUi?: ChatMessage['bookingUi']) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        text,
        bookingUi,
      },
    ]);
  };

  const streamAssistantReply = (fullText: string) =>
    new Promise<void>((resolve) => {
      const id = `a-${Date.now()}`;
      const text = fullText.trim() || 'پاسخی دریافت نشد.';

      if (prefersReducedMotion()) {
        setMessages((prev) => [...prev, { id, role: 'assistant', text }]);
        resolve();
        return;
      }

      const tokens = tokenizeForStream(text);
      setStreaming(true);
      setMessages((prev) => [...prev, { id, role: 'assistant', text: '', streaming: true }]);

      let index = 0;
      streamCancelRef.current = false;

      const tick = () => {
        if (streamCancelRef.current) {
          setStreaming(false);
          resolve();
          return;
        }

        index += 1;
        const next = tokens.slice(0, index).join('');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, text: next, streaming: index < tokens.length } : msg
          )
        );

        if (index >= tokens.length) {
          setStreaming(false);
          streamTimerRef.current = null;
          resolve();
          return;
        }

        const token = tokens[index - 1] ?? '';
        const delay = token.includes('\n') ? 70 : 22 + Math.min(token.trim().length, 8) * 4;
        streamTimerRef.current = window.setTimeout(tick, delay);
      };

      streamTimerRef.current = window.setTimeout(tick, 40);
    });

  const openLogin = () => {
    if (getPortalRagToken() || quota?.isAuthenticated) {
      setAuthError('');
      setLoginOpen(false);
      return;
    }
    setAuthError('');
    setLoginOpen(true);
  };

  const ensureBookingAuth = async (): Promise<boolean> => {
    const entry = await resolveBookingEntry();
    if (entry.action === 'goto-booking') return true;
    setBookingAuthMode(entry.mode);
    setBookingAuthOpen(true);
    return false;
  };

  const loadDaySlots = async (dayKey: string, doctorId?: number): Promise<PortalOpenSlot[]> => {
    const list = await bookingOpenSlots({
      doctorId: doctorId || undefined,
      fromDate: dayKey,
      toDate: dayKey,
    });
    return normalizeOpenSlots(list).filter((s) => slotDayKey(s.startAt) === dayKey);
  };

  const showSlotsForDay = async (dayKey: string, preface?: string, rescheduleBookingId?: number) => {
    const slots = await loadDaySlots(dayKey);
    const label = formatDayLabelFa(dayKey);
    if (slots.length === 0) {
      pushAssistant(preface || `برای ${label} نوبت آزادی پیدا نشد.`);
      return;
    }
    pushAssistant(
      preface ||
        (rescheduleBookingId
          ? `ساعت جدید را برای ${label} انتخاب کنید:`
          : `نوبت‌های آزاد ${label} — روی ساعت بزنید:`),
      {
        type: 'slots',
        dayKey,
        slots,
        rescheduleBookingId,
      }
    );
  };

  const showMyBookingsUi = async (preface?: string) => {
    const mine = normalizeBookings(await bookingMyList()).filter((b) => isActiveBookingStatus(b.status));
    if (mine.length === 0) {
      pushAssistant(preface || 'رزرو فعالی ندارید.');
      return;
    }
    pushAssistant(preface || 'رزروهای فعال شما:', {
      type: 'my_bookings',
      bookings: mine,
    });
  };

  const runBookingIntent = async (intent: BookingIntent) => {
    setBookingBusy(true);
    try {
      if (intent.dateParseError) {
        pushAssistant(intent.dateParseError);
        return;
      }

      const ok = await ensureBookingAuth();
      if (!ok) {
        pendingIntentRef.current = intent;
        pushAssistant('برای ادامه رزرو/لغو نوبت وارد شوید یا مشخصات بیمار را تکمیل کنید.');
        return;
      }

      if (intent.kind === 'my_bookings') {
        await showMyBookingsUi();
        return;
      }

      if (intent.kind === 'cancel') {
        await showMyBookingsUi('کدام نوبت را می‌خواهید لغو کنید؟');
        return;
      }

      if (intent.kind === 'reschedule') {
        rescheduleIdRef.current = 0;
        await showMyBookingsUi('کدام نوبت را می‌خواهید جابجا کنید؟ سپس ساعت جدید را انتخاب کنید.');
        return;
      }

      const dayKey = resolveDayKey(intent);

      if (intent.kind === 'book' && intent.timeHm) {
        const slots = await loadDaySlots(dayKey);
        const match = slots.find((s) => slotMatchesTime(s.startAt, intent.timeHm!));
        if (!match) {
          pushAssistant(
            `ساعت ${intent.timeHm} برای ${formatDayLabelFa(dayKey)} آزاد نیست. یکی از ساعات زیر را انتخاب کنید:`,
            { type: 'slots', dayKey, slots }
          );
          return;
        }
        await bookingCreate({ appointmentSlotId: match.appointmentSlotId });
        pushAssistant(`نوبت شما برای ${formatSlotFull(match.startAt)} ثبت شد.`);
        return;
      }

      // list_slots or book without time
      await showSlotsForDay(dayKey);
    } catch (e: unknown) {
      pushAssistant(apiErrorMessage(e, 'انجام عملیات نوبت ناموفق بود.'));
    } finally {
      setBookingBusy(false);
      focusInput();
    }
  };

  const onSelectSlot = async (slot: PortalOpenSlot, rescheduleBookingId?: number) => {
    if (busy) return;
    setBookingBusy(true);
    try {
      const ok = await ensureBookingAuth();
      if (!ok) {
        pendingIntentRef.current = {
          kind: rescheduleBookingId ? 'reschedule' : 'book',
          dayKey: slotDayKey(slot.startAt),
          timeHm: undefined,
          raw: '',
        };
        pushAssistant('برای رزرو وارد شوید.');
        return;
      }

      if (rescheduleBookingId && rescheduleBookingId > 0) {
        await bookingReschedule({
          appointmentBookingId: rescheduleBookingId,
          newAppointmentSlotId: slot.appointmentSlotId,
        });
        rescheduleIdRef.current = 0;
        pushAssistant(`نوبت به ${formatSlotFull(slot.startAt)} جابجا شد.`);
      } else {
        await bookingCreate({ appointmentSlotId: slot.appointmentSlotId });
        pushAssistant(`نوبت شما برای ${formatSlotFull(slot.startAt)} ثبت شد.`);
      }
    } catch (e: unknown) {
      pushAssistant(apiErrorMessage(e, 'ثبت نوبت ناموفق بود.'));
    } finally {
      setBookingBusy(false);
      focusInput();
    }
  };

  const onAskCancel = (booking: PortalBookingItem) => {
    pushAssistant(`نوبت ${formatSlotFull(booking.startAt)} لغو شود؟`, {
      type: 'confirm_cancel',
      pendingCancelId: booking.appointmentBookingId,
      bookings: [booking],
    });
  };

  const onConfirmCancel = async (bookingId: number, yes: boolean) => {
    if (!yes) {
      pushAssistant('لغو انجام نشد.');
      return;
    }
    setBookingBusy(true);
    try {
      await bookingCancel({ appointmentBookingId: bookingId });
      pushAssistant('نوبت لغو شد.');
    } catch (e: unknown) {
      pushAssistant(apiErrorMessage(e, 'لغو ناموفق بود.'));
    } finally {
      setBookingBusy(false);
    }
  };

  const onStartReschedule = async (booking: PortalBookingItem) => {
    setBookingBusy(true);
    try {
      const ok = await ensureBookingAuth();
      if (!ok) {
        pendingIntentRef.current = { kind: 'reschedule', raw: '' };
        rescheduleIdRef.current = booking.appointmentBookingId;
        pushAssistant('برای جابجایی وارد شوید.');
        return;
      }
      rescheduleIdRef.current = booking.appointmentBookingId;
      const list = await bookingOpenSlots({
        doctorId: booking.doctorId || undefined,
        fromDate: toDayKey(todayLocalDate()),
      });
      const slots = normalizeOpenSlots(list).filter(
        (s) => !booking.doctorId || s.doctorId === booking.doctorId
      );
      if (slots.length === 0) {
        pushAssistant('نوبت آزادی برای جابجایی پیدا نشد.');
        return;
      }
      pushAssistant('ساعت جدید را انتخاب کنید:', {
        type: 'slots',
        slots,
        rescheduleBookingId: booking.appointmentBookingId,
      });
    } catch (e: unknown) {
      pushAssistant(apiErrorMessage(e, 'بارگذاری ساعات آزاد ناموفق بود.'));
    } finally {
      setBookingBusy(false);
    }
  };

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;

    const intent = parseBookingIntent(question);
    if (intent.kind !== 'none') {
      // booking flows bypass RAG guest quota gate
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await runBookingIntent(intent);
      return;
    }

    if (blocked) {
      openLogin();
      return;
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);
    focusInput();

    try {
      const res = await fetchRagAnswer(question, sessionIdRef.current, guestKeyRef.current);
      setLoading(false);

      if (res.requiresLogin) {
        setQuota((prev) =>
          prev
            ? { ...prev, requiresLogin: true, remainingCount: 0, usedCount: res.usedCount ?? prev.usedCount }
            : {
                isAuthenticated: false,
                usedCount: res.usedCount ?? 0,
                dailyLimit: res.dailyLimit ?? 10,
                remainingCount: 0,
                requiresLogin: true,
              }
        );
        await streamAssistantReply(
          res.answer ||
            'سقف سوالات رایگان امروز تمام شد. در صورتی که نیاز به سوالات بیشتر دارید، وارد شوید.'
        );
        openLogin();
        void refreshQuota();
        return;
      }

      if (typeof res.remainingCount === 'number') {
        setQuota((prev) =>
          prev
            ? {
                ...prev,
                usedCount: res.usedCount ?? prev.usedCount,
                dailyLimit: res.dailyLimit ?? prev.dailyLimit,
                remainingCount: res.remainingCount ?? prev.remainingCount,
                isAuthenticated: !!res.isAuthenticated,
                requiresLogin: false,
              }
            : null
        );
      }

      await streamAssistantReply(res.answer || 'پاسخی دریافت نشد.');
      void refreshQuota();
    } catch (err: unknown) {
      setLoading(false);
      const response = err as {
        status?: number;
        data?: { title?: string; detail?: string; message?: string };
      };
      const detail =
        response?.data?.detail ||
        response?.data?.message ||
        response?.data?.title ||
        (response?.status ? `خطای سرور (${response.status})` : 'خطا در ارتباط با سرور');
      await streamAssistantReply(`${detail} لطفاً دوباره تلاش کنید یا با مطب تماس بگیرید.`);
    } finally {
      focusInput();
    }
  };

  const sendOtp = async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      const res = await requestRagOtp(phone.trim());
      startOtpTimer(res.expiresInSeconds ?? OTP_TTL_SECONDS);
    } catch (err: unknown) {
      const response = err as { data?: { detail?: string; message?: string; title?: string } };
      setAuthError(response?.data?.detail || response?.data?.message || response?.data?.title || 'ارسال کد ناموفق بود');
    } finally {
      setAuthBusy(false);
    }
  };

  const verifyOtp = async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      await verifyRagOtp(phone.trim(), otpCode.trim());
      setLoginOpen(false);
      setOtpSent(false);
      setOtpCode('');
      setOtpSecondsLeft(0);
      otpExpireAtRef.current = 0;
      await refreshQuota();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-login-${Date.now()}`,
          role: 'assistant',
          text: 'ورود موفق بود. تاریخچه گفتگو حفظ شد و می‌توانید سوالات بیشتری بپرسید.',
        },
      ]);
      focusInput();
    } catch (err: unknown) {
      const response = err as { data?: { detail?: string; message?: string; title?: string } };
      setAuthError(response?.data?.detail || response?.data?.message || response?.data?.title || 'تأیید کد ناموفق بود');
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = () => {
    setPortalRagToken(null);
    void refreshQuota();
  };

  const onBookingAuthSuccess = () => {
    setBookingAuthOpen(false);
    void refreshQuota();
    const pending = pendingIntentRef.current;
    pendingIntentRef.current = null;
    pushAssistant('ورود/تکمیل مشخصات انجام شد.');
    if (pending) {
      void runBookingIntent(pending);
    } else if (rescheduleIdRef.current > 0) {
      void runBookingIntent({ kind: 'reschedule', raw: '' });
    }
  };

  const renderBookingUi = (msg: ChatMessage) => {
    const ui = msg.bookingUi;
    if (!ui) return null;

    if (ui.type === 'slots' && ui.slots && ui.slots.length > 0) {
      const showDay = !!ui.rescheduleBookingId || new Set(ui.slots.map((s) => slotDayKey(s.startAt))).size > 1;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {ui.slots.map((slot) => (
            <button
              key={slot.appointmentSlotId}
              type="button"
              style={CHIP}
              disabled={busy}
              onClick={() => void onSelectSlot(slot, ui.rescheduleBookingId)}
            >
              {showDay ? formatSlotFull(slot.startAt) : formatSlotTime(slot.startAt)}
            </button>
          ))}
        </div>
      );
    }

    if (ui.type === 'my_bookings' && ui.bookings) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {ui.bookings.map((b) => (
            <div
              key={b.appointmentBookingId}
              style={{
                border: '1px solid rgba(35,37,78,0.12)',
                borderRadius: 12,
                padding: '0.65rem 0.75rem',
                background: '#fff',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{formatSlotFull(b.startAt)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" style={CHIP} disabled={busy} onClick={() => onAskCancel(b)}>
                  لغو
                </button>
                <button
                  type="button"
                  style={CHIP}
                  disabled={busy}
                  onClick={() => void onStartReschedule(b)}
                >
                  جابجایی
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (ui.type === 'confirm_cancel' && ui.pendingCancelId) {
      return (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            style={BTN_PRIMARY}
            disabled={busy}
            onClick={() => void onConfirmCancel(ui.pendingCancelId!, true)}
          >
            بله، لغو شود
          </button>
          <button
            type="button"
            style={BTN_GHOST}
            disabled={busy}
            onClick={() => void onConfirmCancel(ui.pendingCancelId!, false)}
          >
            خیر
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="portal-assistant">
      <div className="portal-assistant__glow" aria-hidden />

      <header className="portal-assistant__header">
        <button
          type="button"
          className="portal-assistant__back"
          onClick={() => navigate('/')}
          aria-label="بازگشت به سایت"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M14.5 5.5 9 11l5.5 5.5-1.4 1.4L6.2 11l7.9-7.9 1.4 1.4z"
            />
          </svg>
          بازگشت
        </button>

        <div className="portal-assistant__brand">
          <div className="portal-assistant__avatar" aria-hidden>
            <RobotIcon />
          </div>
          <div className="portal-assistant__brand-text">
            <h1>دستیار هوشمند مطب</h1>
            <p className="portal-assistant__status">
              <span className="portal-assistant__status-dot" />
              <span className="portal-assistant__status-label">
                {quota?.isAuthenticated
                  ? `وارد شده${quota.phoneMasked ? ` · ${quota.phoneMasked}` : ''}`
                  : 'مهمان · پاسخ و رزرو نوبت'}
              </span>
              <span className="portal-assistant__build" title="نسخه UI برای تأیید دیپلوی">
                build-v17-patient
              </span>
            </p>
          </div>
        </div>

        <div className="portal-assistant__quota">
          {quota && (
            <span className="portal-assistant__quota-count" title="سقف سوالات روزانه">
              {quota.usedCount}/{quota.dailyLimit}
            </span>
          )}
          {quota?.isAuthenticated || getPortalRagToken() ? (
            <>
              <Link to="/patient" className="portal-assistant__linkbtn">
                پنل بیمار
              </Link>
              <button type="button" className="portal-assistant__linkbtn" onClick={logout}>
                خروج
              </button>
            </>
          ) : (
            <button type="button" className="portal-assistant__login-btn" style={BTN_LOGIN_PILL} onClick={openLogin}>
              ورود
            </button>
          )}
        </div>
      </header>

      <div
        className={`portal-assistant__messages${emptyChat ? ' is-empty' : ''}`}
        ref={messagesRef}
        role="log"
        aria-live="polite"
      >
        <div className="portal-assistant__thread">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`portal-assistant__row portal-assistant__row--${msg.role}${
                msg.id === 'welcome' ? ' portal-assistant__row--static' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="portal-assistant__msg-avatar" aria-hidden>
                  <RobotIcon />
                </div>
              )}
              <div
                className={`portal-assistant__bubble portal-assistant__bubble--${msg.role}${
                  msg.streaming ? ' portal-assistant__bubble--streaming' : ''
                }${msg.id === 'welcome' ? ' portal-assistant__bubble--welcome' : ''}`}
              >
                {msg.id === 'welcome' && (
                  <span className="portal-assistant__bubble-label">خوش آمدید</span>
                )}
                <span className="portal-assistant__bubble-text">{msg.text}</span>
                {msg.streaming && <span className="portal-assistant__caret" aria-hidden />}
                {renderBookingUi(msg)}
              </div>
              {msg.role === 'user' && (
                <div className="portal-assistant__msg-avatar portal-assistant__msg-avatar--user" aria-hidden>
                  <UserIcon />
                </div>
              )}
            </div>
          ))}

          {(loading || bookingBusy) && (
            <div className="portal-assistant__row portal-assistant__row--assistant">
              <div className="portal-assistant__msg-avatar" aria-hidden>
                <RobotIcon />
              </div>
              <div className="portal-assistant__bubble portal-assistant__bubble--assistant portal-assistant__bubble--thinking">
                <span className="portal-assistant__thinking-label">
                  {bookingBusy ? 'در حال نوبت‌دهی' : 'در حال فکر کردن'}
                </span>
                <span className="portal-assistant__dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="portal-assistant__suggestions">
              <div className="portal-assistant__suggestions-head">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12 2a7 7 0 0 0-4 12.74V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.26A7 7 0 0 0 12 2zm0 2a5 5 0 0 1 3.9 8.32l-.4.48V17h-3V12.8l-.4-.48A5 5 0 0 1 12 4z"
                  />
                </svg>
                <p>پیشنهاد سریع</p>
              </div>
              <div className="portal-assistant__chips">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="portal-assistant__chip"
                    onClick={() => void send(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="portal-assistant__composer-wrap">
        {blocked && (
          <div className="portal-assistant__limit-banner" role="alert">
            <div className="portal-assistant__limit-banner-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M12 2 1 21h22L12 2zm0 4.5L19.5 19h-15L12 6.5zM11 10v5h2v-5h-2zm0 7v2h2v-2h-2z"
                />
              </svg>
            </div>
            <div className="portal-assistant__limit-banner-text">
              سقف سوالات رایگان امروز تمام شد.
              <strong> برای سوالات بیشتر وارد شوید. رزرو نوبت همچنان با ورود بیمار ممکن است.</strong>
            </div>
            <button type="button" className="portal-assistant__limit-login" style={BTN_LOGIN_PILL} onClick={openLogin}>
              ورود / لاگین
            </button>
          </div>
        )}
        <div className="portal-assistant__composer">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            placeholder={blocked ? 'سوال FAQ نیاز به ورود دارد… یا بنویسید نوبت‌های فردا' : 'سوال یا درخواست نوبت…'}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
                focusInput();
              }
            }}
          />
          <button
            type="button"
            className="portal-assistant__send"
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            aria-label="ارسال"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path fill="currentColor" d="M3.4 20.6 21 12 3.4 3.4l.1 6.7L14 12l-10.5 1.9-.1 6.7z" />
            </svg>
          </button>
        </div>
        <p className="portal-assistant__hint">Enter برای ارسال · Shift+Enter خط جدید · نوبت با دکمه ساعت</p>
      </div>

      {loginOpen && (
        <div className="portal-assistant__modal-backdrop" role="presentation" onClick={() => setLoginOpen(false)}>
          <div
            className="portal-assistant__modal"
            role="dialog"
            aria-modal="true"
            aria-label="ورود با موبایل"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="portal-assistant__modal-head">
              <div className="portal-assistant__modal-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="currentColor"
                    d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
                  />
                </svg>
              </div>
              <div>
                <h2>ورود به دستیار هوشمند</h2>
                <p>با شماره موبایل وارد شوید تا سقف سوالات بیشتری داشته باشید.</p>
              </div>
              <button
                type="button"
                className="portal-assistant__modal-close"
                aria-label="بستن"
                onClick={() => setLoginOpen(false)}
              >
                ×
              </button>
            </div>

            <label className="portal-assistant__field">
              شماره موبایل
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                inputMode="tel"
                disabled={authBusy}
                autoFocus={!otpSent}
              />
            </label>

            {otpSent && (
              <>
                <label className="portal-assistant__field">
                  کد تأیید
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="کد ۶ رقمی"
                    inputMode="numeric"
                    disabled={authBusy}
                    autoFocus
                  />
                </label>
                <p className={`portal-assistant__otp-timer${otpSecondsLeft <= 0 ? ' is-expired' : ''}`}>
                  {otpSecondsLeft > 0
                    ? `اعتبار کد: ${formatCountdown(otpSecondsLeft)}`
                    : 'اعتبار کد تمام شد. دوباره «ارسال کد» را بزنید'}
                </p>
              </>
            )}

            {authError && <p className="portal-assistant__auth-error">{authError}</p>}

            <div className="portal-assistant__modal-actions">
              <button type="button" className="portal-assistant__ghost" style={BTN_GHOST} onClick={() => setLoginOpen(false)}>
                انصراف
              </button>
              {!otpSent || otpSecondsLeft <= 0 ? (
                <button
                  type="button"
                  className="portal-assistant__primary"
                  style={{
                    ...BTN_PRIMARY,
                    opacity: authBusy || !phone.trim() ? 0.55 : 1,
                  }}
                  disabled={authBusy || !phone.trim()}
                  onClick={() => void sendOtp()}
                >
                  ارسال کد
                </button>
              ) : (
                <>
                  <button type="button" className="portal-assistant__ghost" style={BTN_GHOST} disabled={authBusy} onClick={() => void sendOtp()}>
                    ارسال مجدد
                  </button>
                  <button
                    type="button"
                    className="portal-assistant__primary"
                    style={{
                      ...BTN_PRIMARY,
                      opacity: authBusy || !otpCode.trim() ? 0.55 : 1,
                    }}
                    disabled={authBusy || !otpCode.trim()}
                    onClick={() => void verifyOtp()}
                  >
                    تأیید و ورود
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <PortalAuthModal
        open={bookingAuthOpen}
        onClose={() => {
          setBookingAuthOpen(false);
          pendingIntentRef.current = null;
        }}
        onSuccess={onBookingAuthSuccess}
        initialMode={bookingAuthMode}
      />
    </div>
  );
}
