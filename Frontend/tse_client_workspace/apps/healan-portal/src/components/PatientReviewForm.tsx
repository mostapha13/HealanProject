import React, { useState } from 'react';
import { submitPatientReview } from '../api/portalApi';

interface PatientReviewFormProps {
  onSuccess?: () => void;
}

export function PatientReviewForm({ onSuccess }: PatientReviewFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await submitPatientReview({ displayName, contactInfo, reviewText, rating });
      setDisplayName('');
      setContactInfo('');
      setReviewText('');
      setRating(5);
      setMessage({ type: 'success', text: 'نظر شما ثبت شد و پس از تأیید مدیر در سایت نمایش داده می‌شود.' });
      onSuccess?.();
    } catch {
      setMessage({ type: 'error', text: 'ثبت نظر انجام نشد. لطفاً اطلاعات را بررسی کنید.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="portal-review-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="portal-review-form__grid">
        <label>
          نام شما
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />
        </label>
        <label>
          موبایل یا ایمیل
          <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required placeholder="09xxxxxxxxx یا email@example.com" />
        </label>
      </div>
      <label>
        امتیاز
        <div className="portal-review-form__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`portal-star-btn${rating >= star ? ' is-active' : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} ستاره`}
            >
              ★
            </button>
          ))}
        </div>
      </label>
      <label>
        متن نظر
        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} required minLength={10} rows={4} />
      </label>
      {message && <p className={`portal-review-form__msg portal-review-form__msg--${message.type}`}>{message.text}</p>}
      <button type="submit" className="p-btn p-btn--primary" disabled={submitting}>
        {submitting ? 'در حال ارسال...' : 'ثبت نظر'}
      </button>
    </form>
  );
}
