import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRagAnswer } from '../../api/portalApi';

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

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}`;
}

function tokenizeForStream(text: string): string[] {
  const parts = text.match(/\S+\s*/g);
  return parts && parts.length > 0 ? parts : [text];
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef(createSessionId());
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const streamCancelRef = useRef(false);

  const busy = loading || streaming;
  const showSuggestions = messages.length <= 1 && !busy;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streaming]);

  useEffect(() => {
    return () => {
      streamCancelRef.current = true;
      if (streamTimerRef.current != null) {
        window.clearTimeout(streamTimerRef.current);
      }
    };
  }, []);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
            msg.id === id
              ? { ...msg, text: next, streaming: index < tokens.length }
              : msg
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

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || busy) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const res = await fetchRagAnswer(question, sessionIdRef.current);
      setLoading(false);
      await streamAssistantReply(res.answer || 'پاسخی دریافت نشد.');
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
        (response?.status === 404
          ? 'سرویس پاسخ‌گویی روی سرور فعال نیست.'
          : response?.status
            ? `خطای سرور (${response.status})`
            : 'خطا در ارتباط با سرور');
      await streamAssistantReply(`${detail} لطفاً دوباره تلاش کنید یا با مطب تماس بگیرید.`);
    }
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
              d="M9.7 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L13.6 12 9.7 8.1a1 1 0 0 1 0-1.8z"
            />
          </svg>
          بازگشت
        </button>

        <div className="portal-assistant__brand">
          <div className="portal-assistant__avatar" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 2a5 5 0 0 1 5 5v1.1A5 5 0 0 1 20 13v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-1H5a1 1 0 0 1-1-1v-2a5 5 0 0 1 3-4.6V7a5 5 0 0 1 5-5zm-3 15v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1H9zm0-8.5A2.5 2.5 0 0 0 6.5 11v3H9V8.5zm9 5.5v-3A2.5 2.5 0 0 0 15 8.5V14h3z"
              />
            </svg>
          </div>
          <div>
            <h1>دستیار هوشمند مطب</h1>
            <p className="portal-assistant__status">
              <span className="portal-assistant__status-dot" />
              آنلاین · پاسخ بر اساس اطلاعات رسمی مطب
            </p>
          </div>
        </div>
      </header>

      <div className="portal-assistant__messages" role="log" aria-live="polite">
        <div className="portal-assistant__thread">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`portal-assistant__row portal-assistant__row--${msg.role}`}
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
              <div className="portal-assistant__msg-avatar" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    fill="currentColor"
                    d="M12 2a5 5 0 0 1 5 5v1.1A5 5 0 0 1 20 13v2a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-1H5a1 1 0 0 1-1-1v-2a5 5 0 0 1 3-4.6V7a5 5 0 0 1 5-5z"
                  />
                </svg>
              </div>
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

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="portal-assistant__composer-wrap">
        <div className="portal-assistant__composer">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            placeholder="سوال خود را بنویسید…"
            disabled={busy}
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
            disabled={busy || !input.trim()}
            aria-label="ارسال"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path
                fill="currentColor"
                d="M3.4 20.6 21 12 3.4 3.4l.1 6.7L14 12l-10.5 1.9-.1 6.7z"
              />
            </svg>
          </button>
        </div>
        <p className="portal-assistant__hint">Enter برای ارسال · Shift+Enter خط جدید</p>
      </div>
    </div>
  );
}
