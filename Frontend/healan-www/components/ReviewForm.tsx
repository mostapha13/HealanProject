'use client';

import { FormEvent, useState } from 'react';

export function ReviewForm() {
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(false);
    try {
      const base = (process.env.NEXT_PUBLIC_HEALAN_API_URL || '/Healan/api/v1/').replace(
        /\/?$/,
        '/'
      );
      const res = await fetch(`${base}PortalPublic/SubmitReview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ displayName, contactInfo, reviewText, rating }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { title?: string; message?: string }
          | null;
        throw new Error(body?.title || body?.message || 'submit failed');
      }
      setDisplayName('');
      setContactInfo('');
      setReviewText('');
      setRating(5);
      setMessage('نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.');
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error && err.message && err.message !== 'submit failed'
          ? err.message
          : 'ثبت نظر ناموفق بود. موبایل (09xxxxxxxxx) یا ایمیل معتبر لازم است.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={onSubmit}>
      <h3>ثبت نظر شما</h3>
      <label>
        نام نمایشی
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
        />
      </label>
      <label>
        موبایل یا ایمیل (الزامی)
        <input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          required
          placeholder="09xxxxxxxxx یا email@example.com"
        />
      </label>
      <label>
        امتیاز
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label>
        متن نظر
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
          minLength={10}
          rows={4}
        />
      </label>
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? '...' : 'ارسال نظر'}
      </button>
      {message ? (
        <p className={`review-form__msg${error ? ' is-error' : ''}`}>{message}</p>
      ) : null}
    </form>
  );
}
