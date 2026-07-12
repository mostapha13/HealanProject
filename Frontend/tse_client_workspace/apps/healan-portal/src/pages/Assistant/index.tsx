import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRagAnswer } from '../../api/portalApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}`;
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'سلام! من دستیار هوشمند مطب دکتر شهرویی هستم. درباره آدرس، ساعات کاری، خدمات و نوبت‌دهی از من بپرسید.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(createSessionId());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetchRagAnswer(question, sessionIdRef.current);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.answer || 'پاسخی دریافت نشد.',
        },
      ]);
    } catch (err: unknown) {
      const response = err as { status?: number; data?: { title?: string; detail?: string; message?: string } };
      const detail =
        response?.data?.detail ||
        response?.data?.message ||
        response?.data?.title ||
        (response?.status === 404
          ? 'سرویس RAG روی API فعال نیست. Healan WebApi را rebuild و restart کنید.'
          : response?.status
            ? `خطای سرور (${response.status})`
            : 'خطا در ارتباط با سرور');
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `${detail}. لطفاً دوباره تلاش کنید یا با مطب تماس بگیرید.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-assistant">
      <header className="portal-assistant__header">
        <button type="button" className="portal-assistant__back" onClick={() => navigate('/')}>
          ← بازگشت به سایت
        </button>
        <div>
          <h1>دستیار هوشمند مطب</h1>
          <p>پاسخ بر اساس اطلاعات رسمی مطب</p>
        </div>
      </header>

      <div className="portal-assistant__messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`portal-assistant__bubble portal-assistant__bubble--${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="portal-assistant__bubble portal-assistant__bubble--assistant">در حال جستجو...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="portal-assistant__composer">
        <textarea
          rows={2}
          value={input}
          placeholder="سوال خود را بنویسید، مثلاً: آدرس مطب کجاست؟"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button type="button" onClick={() => void send()} disabled={loading || !input.trim()}>
          ارسال
        </button>
      </div>
    </div>
  );
}
