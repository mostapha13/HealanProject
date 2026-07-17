import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  bookingCompleteProfile,
  bookingProfileStatus,
  bookingRegisterOtpRequest,
  bookingRegisterOtpVerify,
  getPortalRagToken,
  type PortalBookingAuthResult,
} from '../api/portalApi';

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

export type PortalAuthModalMode = 'register' | 'complete';

export interface PortalAuthModalProps {
  open: boolean;
  onClose: () => void;
  /** After success: default navigates to /booking */
  onSuccess?: (profile: PortalBookingAuthResult) => void;
  initialMode?: PortalAuthModalMode;
  prefill?: Partial<{
    phoneNumber: string;
    firstName: string;
    lastName: string;
    nationalCode: string;
  }>;
}

/**
 * Booking registration modal: profile fields → OTP (or complete-profile when already logged in).
 */
export function PortalAuthModal({
  open,
  onClose,
  onSuccess,
  initialMode = 'register',
  prefill,
}: PortalAuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'profile' | 'otp'>('profile');
  const [mode, setMode] = useState<PortalAuthModalMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (!open) return;
    setError('');
    setOtpCode('');
    setStep('profile');
    setMode(initialMode);
    setForm({
      firstName: prefill?.firstName ?? '',
      lastName: prefill?.lastName ?? '',
      nationalCode: prefill?.nationalCode ?? '',
      phoneNumber: toAsciiDigits(prefill?.phoneNumber ?? '').slice(0, 11),
    });

    const token = getPortalRagToken();
    if (!token) return;
    void bookingProfileStatus()
      .then((status) => {
        if (status?.isAuthenticated && !status.isPatient) {
          setMode('complete');
          setForm((prev) => ({
            ...prev,
            phoneNumber: toAsciiDigits(status.phoneNumber || prev.phoneNumber).slice(0, 11),
            firstName: status.firstName || prev.firstName,
            lastName: status.lastName || prev.lastName,
            nationalCode: toAsciiDigits(status.nationalCode || prev.nationalCode).slice(0, 10),
          }));
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [open, initialMode, prefill?.phoneNumber, prefill?.firstName, prefill?.lastName, prefill?.nationalCode]);

  if (!open) return null;

  const finish = (profile: PortalBookingAuthResult) => {
    if (onSuccess) onSuccess(profile);
    else navigate('/booking');
    onClose();
  };

  const submitProfile = async () => {
    setError('');
    setBusy(true);
    try {
      const phone = toAsciiDigits(form.phoneNumber);
      const national = toAsciiDigits(form.nationalCode);
      if (form.firstName.trim().length < 2) throw new Error('نام را وارد کنید.');
      if (form.lastName.trim().length < 2) throw new Error('نام خانوادگی را وارد کنید.');
      if (national.length !== 10) throw new Error('کد ملی باید ۱۰ رقم باشد.');
      if (phone.length !== 11 || !phone.startsWith('09')) {
        throw new Error('شماره موبایل معتبر نیست (مثال: 09123456789)');
      }

      setForm((prev) => ({ ...prev, phoneNumber: phone, nationalCode: national }));

      if (mode === 'complete' && getPortalRagToken()) {
        const res = await bookingCompleteProfile({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nationalCode: national,
          phoneNumber: phone,
        });
        finish(res);
        return;
      }

      await bookingRegisterOtpRequest({
        phoneNumber: phone,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalCode: national,
      });
      setStep('otp');
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'ارسال کد ناموفق بود'));
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    setError('');
    setBusy(true);
    try {
      const phone = toAsciiDigits(form.phoneNumber);
      const code = toAsciiDigits(otpCode);
      if (code.length < 4) throw new Error('کد تأیید را کامل وارد کنید.');
      const res = await bookingRegisterOtpVerify({ phoneNumber: phone, code });
      if (!res?.accessToken) throw new Error('تأیید انجام نشد. دوباره تلاش کنید.');
      finish(res);
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'کد تأیید نادرست است'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="portal-auth-modal__backdrop" role="dialog" aria-modal="true">
      <div className="portal-auth-modal">
        <button type="button" className="portal-auth-modal__close" onClick={onClose} aria-label="بستن">
          ×
        </button>
        <h2 className="portal-auth-modal__title">
          {step === 'otp' ? 'تأیید کد پیامک' : mode === 'complete' ? 'تکمیل مشخصات بیمار' : 'ثبت‌نام برای رزرو نوبت'}
        </h2>
        <p className="portal-auth-modal__lead">
          {step === 'otp'
            ? `کد ارسال‌شده به ${form.phoneNumber} را وارد کنید.`
            : 'نام، نام خانوادگی، کد ملی و موبایل را وارد کنید. پس از تأیید پیامک می‌توانید نوبت رزرو کنید.'}
        </p>

        {error && <div className="portal-booking__error">{error}</div>}

        {step === 'profile' && (
          <div className="portal-auth-modal__fields">
            <label className="portal-booking__label">نام</label>
            <input
              className="portal-booking__input"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              autoComplete="given-name"
            />
            <label className="portal-booking__label">نام خانوادگی</label>
            <input
              className="portal-booking__input"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              autoComplete="family-name"
            />
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
            <label className="portal-booking__label">شماره موبایل</label>
            <input
              className="portal-booking__input"
              inputMode="numeric"
              value={form.phoneNumber}
              disabled={mode === 'complete'}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: toAsciiDigits(e.target.value).slice(0, 11) })
              }
              placeholder="09123456789"
            />
            <div className="portal-booking__actions">
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--green"
                disabled={busy}
                onClick={() => void submitProfile()}
              >
                {busy
                  ? mode === 'complete'
                    ? 'در حال ذخیره…'
                    : 'در حال ارسال کد…'
                  : mode === 'complete'
                    ? 'ذخیره و ادامه'
                    : 'ارسال کد تأیید'}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="portal-auth-modal__fields">
            <label className="portal-booking__label">کد تأیید</label>
            <input
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
                onClick={() => void submitOtp()}
              >
                {busy ? 'در حال تأیید و ثبت بیمار…' : 'تأیید و ادامه'}
              </button>
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--outline"
                disabled={busy}
                onClick={() => setStep('profile')}
              >
                ویرایش مشخصات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Decide booking CTA: patient → /booking, else open register/complete modal. */
export async function resolveBookingEntry(): Promise<
  | { action: 'goto-booking'; profile: PortalBookingAuthResult }
  | { action: 'open-modal'; mode: PortalAuthModalMode; profile?: PortalBookingAuthResult }
> {
  const token = getPortalRagToken();
  if (!token) return { action: 'open-modal', mode: 'register' };
  try {
    const status = await bookingProfileStatus();
    if (status?.isAuthenticated && status.isPatient) {
      return { action: 'goto-booking', profile: status };
    }
    if (status?.isAuthenticated) {
      return { action: 'open-modal', mode: 'complete', profile: status };
    }
  } catch {
    /* fall through */
  }
  return { action: 'open-modal', mode: 'register' };
}
