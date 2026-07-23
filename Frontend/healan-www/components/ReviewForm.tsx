'use client';

import { FormEvent, useState } from 'react';

export function ReviewForm() {
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
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

  const shown = hoverRating || rating;

  return (
    <form className="review-form" onSubmit={onSubmit}>
      <div className="review-form__intro">
        <h3>ثبت نظر شما</h3>
        <p>تجربه ویزیت خود را با دیگران به اشتراک بگذارید.</p>
      </div>

      <fieldset className="star-rating">
        <legend>امتیاز شما</legend>
        <div
          className="star-rating__row"
          onMouseLeave={() => setHoverRating(0)}
          role="radiogroup"
          aria-label="امتیاز از ۱ تا ۵"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ستاره`}
              className={
                n <= shown ? 'star-rating__star is-on' : 'star-rating__star'
              }
              onMouseEnter={() => setHoverRating(n)}
              onFocus={() => setHoverRating(n)}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        <span className="star-rating__hint">{shown} از ۵</span>
      </fieldset>

      <label>
        نام نمایشی
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          placeholder="مثلاً بیمار قلب"
          autoComplete="nickname"
        />
      </label>
      <label>
        موبایل یا ایمیل
        <input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          required
          placeholder="09xxxxxxxxx یا email@example.com"
          autoComplete="tel"
        />
      </label>
      <label>
        متن نظر
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
          minLength={10}
          rows={5}
          placeholder="از تجربه معاینه، برخورد و کیفیت خدمات بنویسید..."
        />
      </label>
      <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
        {busy ? 'در حال ارسال...' : 'ارسال نظر'}
      </button>
      {message ? (
        <p className={`review-form__msg${error ? ' is-error' : ''}`}>{message}</p>
      ) : null}
    </form>
  );
}
