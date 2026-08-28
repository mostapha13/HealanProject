'use client';

import { FormEvent, useState } from 'react';

type FormState = { firstName: string; lastName: string; mobile: string; message: string; website: string };
const empty: FormState = { firstName: '', lastName: '', mobile: '', message: '', website: '' };

export function ContactForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setStatus('sending'); setError('');
    try {
      const response = await fetch('/Healan/api/v1/PortalPublic/SubmitContactMessage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { title?: string; detail?: string } | null;
        throw new Error(body?.detail || body?.title || 'ارسال پیام ناموفق بود');
      }
      setForm(empty); setStatus('success');
    } catch (err) { setError(err instanceof Error ? err.message : 'ارسال پیام ناموفق بود'); setStatus('error'); }
  };
  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form__head"><span className="section-badge">ارتباط با ما</span><h3>پیام خود را برای مطب بفرستید</h3><p>همکاران مطب پس از بررسی با شما تماس می‌گیرند.</p></div>
      <div className="contact-form__grid">
        <label><span>نام</span><input required minLength={2} maxLength={100} autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></label>
        <label><span>نام خانوادگی</span><input required minLength={2} maxLength={100} autoComplete="family-name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></label>
      </div>
      <label><span>شماره موبایل</span><input required inputMode="numeric" dir="ltr" pattern="09[0-9۰-۹]{9}" placeholder="09123456789" autoComplete="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} /></label>
      <label><span>پیام</span><textarea required minLength={10} maxLength={3000} rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} /></label>
      <label className="contact-form__trap" aria-hidden>وب‌سایت<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
      {status === 'success' && <p className="form-notice form-notice--success" role="status">پیام شما با موفقیت ثبت شد.</p>}
      {status === 'error' && <p className="form-notice form-notice--error" role="alert">{error}</p>}
      <button className="btn btn--primary btn--lg" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'در حال ارسال…' : 'ارسال پیام'}</button>
      <small>اطلاعات شما فقط برای پاسخ‌گویی توسط مطب استفاده می‌شود.</small>
    </form>
  );
}
