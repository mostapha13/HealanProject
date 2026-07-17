import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchRagAnswer,
  fetchRagQuota,
  getPortalRagToken,
  requestRagOtp,
  setPortalRagToken,
  verifyRagOtp,
  type RagQuotaStatus,
} from '../../api/portalApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  'آدرس مطب کجاست؟',
  'ساعات کاری مطب چیست؟',
  'چطور نوبت بگیرم؟',
  'چه خدماتی ارائه می‌دهید؟',
];

const WELCOME =
  'سلام! من دستیار هوشمند مطب دکتر شهرویی هستم. درباره آدرس، ساعات کاری، خدمات و نوبت‌دهی از من بپرسید.';

const GUEST_COOKIE = 'healan_rag_guest';
const OTP_TTL_SECONDS = 120;

const BTN_PRIMARY: React.CSSProperties = {
  backgroundColor: '#ef394e',
  backgroundImage: 'none',
  color: '#ffffff',
  border: 'none',
  borderRadius: 12,
  padding: '0.65rem 1.15rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(239, 57, 78, 0.28)',
};

const BTN_GHOST: React.CSSProperties = {
  backgroundColor: '#e8ebf2',
  backgroundImage: 'none',
  color: '#23254e',
  border: 'none',
  borderRadius: 12,
  padding: '0.65rem 1.15rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const BTN_LOGIN_PILL: React.CSSProperties = {
  backgroundColor: '#ef394e',
  backgroundImage: 'none',
  color: '#ffffff',
  border: 'none',
  borderRadius: 999,
  padding: '0.45rem 1rem',
  fontWeight: 700,
  fontSize: '0.88rem',
  cursor: 'pointer',
  boxShadow: '0 6px 14px rgba(239, 57, 78, 0.25)',
  whiteSpace: 'nowrap',
};

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
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
  const sessionIdRef = useRef(createSessionId());
  const guestKeyRef = useRef(ensureGuestKey());
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const streamCancelRef = useRef(false);
  const otpExpireAtRef = useRef<number>(0);
  const hasScrolledRef = useRef(false);

  const busy = loading || streaming;
  const emptyChat = messages.length <= 1 && !busy;
  const showSuggestions = emptyChat;
  const blocked = !!quota?.requiresLogin && !quota.isAuthenticated;

  const focusInput = () => {
    window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el || el.disabled) return;
      el.focus({ preventScroll: true });
    });
  };

  const scrollMessagesToBottom = (smooth = true) => {
    const el = messagesRef.current;
    if (!el) return;
    // فقط داخل باکس پیام‌ها اسکرول کن — scrollIntoView کل صفحه را جابه‌جا می‌کند
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

  // قفل اسکرول صفحه تا هدر چت از viewport بیرون نرود
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
  }, [messages, loading, streaming, emptyChat]);

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
    setAuthError('');
    setLoginOpen(true);
  };

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;

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
          بازگشت
        </button>

        <div className="portal-assistant__brand">
          <div className="portal-assistant__avatar" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 2a5 5 0 0 1 5 5v1.1A5 5 0 0 1 20 13v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-1H5a1 1 0 0 1-1-1v-2a5 5 0 0 1 3-4.6V7a5 5 0 0 1 5-5z"
              />
            </svg>
          </div>
          <div className="portal-assistant__brand-text">
            <h1>دستیار هوشمند مطب</h1>
            <p className="portal-assistant__status">
              <span className="portal-assistant__status-dot" />
              {quota?.isAuthenticated
                ? `وارد شده${quota.phoneMasked ? ` · ${quota.phoneMasked}` : ''}`
                : 'مهمان · پاسخ بر اساس اطلاعات رسمی مطب'}
            </p>
          </div>
        </div>

        <div className="portal-assistant__quota">
          {quota && (
            <span className="portal-assistant__quota-count">
              امروز: {quota.usedCount}/{quota.dailyLimit}
            </span>
          )}
          {quota?.isAuthenticated || getPortalRagToken() ? (
            <button type="button" className="portal-assistant__linkbtn" onClick={logout}>
              خروج
            </button>
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
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="currentColor"
                      d="M12 2a5 5 0 0 1 5 5v1.1A5 5 0 0 1 20 13v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-1H5a1 1 0 0 1-1-1v-2a5 5 0 0 1 3-4.6V7a5 5 0 0 1 5-5z"
                    />
                  </svg>
                </div>
              )}
              <div
                className={`portal-assistant__bubble portal-assistant__bubble--${msg.role}${
                  msg.streaming ? ' portal-assistant__bubble--streaming' : ''
                }`}
              >
                <span className="portal-assistant__bubble-text">{msg.text}</span>
                {msg.streaming && <span className="portal-assistant__caret" aria-hidden />}
              </div>
            </div>
          ))}

          {loading && (
            <div className="portal-assistant__row portal-assistant__row--assistant">
              <div className="portal-assistant__msg-avatar" aria-hidden />
              <div className="portal-assistant__bubble portal-assistant__bubble--assistant portal-assistant__bubble--thinking">
                <span className="portal-assistant__thinking-label">در حال فکر کردن</span>
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
              <p>پیشنهاد سوال:</p>
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
          <div className="portal-assistant__limit-banner">
            <div className="portal-assistant__limit-banner-text">
              سقف سوالات رایگان امروز تمام شد.
              <strong> در صورتی که نیاز به سوالات بیشتر دارید، وارد شوید.</strong>
            </div>
            <button
              type="button"
              className="portal-assistant__limit-login"
              style={BTN_LOGIN_PILL}
              onClick={openLogin}
            >
              ورود / لاگین
            </button>
          </div>
        )}
        <div className="portal-assistant__composer">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            placeholder={blocked ? 'برای ادامه وارد شوید…' : 'سوال خود را بنویسید…'}
            disabled={busy || blocked}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="button"
            className="portal-assistant__send"
            onClick={() => void send()}
            disabled={busy || blocked || !input.trim()}
            aria-label="ارسال"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path fill="currentColor" d="M3.4 20.6 21 12 3.4 3.4l.1 6.7L14 12l-10.5 1.9-.1 6.7z" />
            </svg>
          </button>
        </div>
        <p className="portal-assistant__hint">Enter برای ارسال · Shift+Enter خط جدید</p>
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
            <h2>ورود به دستیار هوشمند</h2>
            <p>با شماره موبایل وارد شوید تا سقف سوالات بیشتری داشته باشید. تاریخچه گفتگو حفظ می‌شود.</p>

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
                    ? `اعتبار کد: ${formatCountdown(otpSecondsLeft)} — می‌توانید همان کد قبلی را وارد کنید`
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
                    cursor: authBusy || !phone.trim() ? 'not-allowed' : 'pointer',
                  }}
                  disabled={authBusy || !phone.trim()}
                  onClick={() => void sendOtp()}
                >
                  ارسال کد
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="portal-assistant__ghost"
                    style={BTN_GHOST}
                    disabled={authBusy}
                    onClick={() => void sendOtp()}
                  >
                    ارسال مجدد
                  </button>
                  <button
                    type="button"
                    className="portal-assistant__primary"
                    style={{
                      ...BTN_PRIMARY,
                      opacity: authBusy || !otpCode.trim() ? 0.55 : 1,
                      cursor: authBusy || !otpCode.trim() ? 'not-allowed' : 'pointer',
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
    </div>
  );
}
