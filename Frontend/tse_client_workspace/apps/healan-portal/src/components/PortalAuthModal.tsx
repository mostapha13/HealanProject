import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  bookingCompleteProfile,
  bookingOtpRequest,
  bookingOtpVerify,
  bookingProfileStatus,
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

function isCompletePatientProfile(p: {
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
}): boolean {
  return (
    (p.firstName || '').trim().length >= 2 &&
    (p.lastName || '').trim().length >= 2 &&
    toAsciiDigits(p.nationalCode).length === 10
  );
}

export type PortalAuthModalMode = 'register' | 'complete';
type AuthStep = 'phone' | 'otp' | 'profile' | 'confirm';

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
 * رزرو نوبت:
 * register → موبایل → OTP → اگر بیمار موجود بود تأیید مشخصات، وگرنه جمع‌آوری نام/کدملی
 * complete → فقط تکمیل مشخصات (وقتی JWT هست ولی بیمار کامل نیست)
 */
export function PortalAuthModal({
  open,
  onClose,
  onSuccess,
  initialMode = 'register',
  prefill,
}: PortalAuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('phone');
  const [mode, setMode] = useState<PortalAuthModalMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authSnapshot, setAuthSnapshot] = useState<PortalBookingAuthResult | null>(null);
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
    setAuthSnapshot(null);
    setMode(initialMode);
    setForm({
      firstName: prefill?.firstName ?? '',
      lastName: prefill?.lastName ?? '',
      nationalCode: toAsciiDigits(prefill?.nationalCode ?? '').slice(0, 10),
      phoneNumber: toAsciiDigits(prefill?.phoneNumber ?? '').slice(0, 11),
    });

    if (initialMode === 'complete') {
      setStep('profile');
    } else {
      setStep('phone');
    }

    const token = getPortalRagToken();
    if (!token) return;
    void bookingProfileStatus()
      .then((status) => {
        if (status?.isAuthenticated && !status.isPatient) {
          setMode('complete');
          setStep('profile');
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

  const title =
    step === 'otp'
      ? 'تأیید کد پیامک'
      : step === 'phone'
        ? 'ورود با موبایل'
        : step === 'confirm'
          ? 'تأیید مشخصات'
          : mode === 'complete'
            ? 'تکمیل مشخصات بیمار'
            : 'ثبت مشخصات بیمار';

  const lead =
    step === 'otp'
      ? `کد ارسال‌شده به ${form.phoneNumber} را وارد کنید.`
      : step === 'phone'
        ? 'شماره موبایل را وارد کنید تا کد تأیید برایتان پیامک شود.'
        : step === 'confirm'
          ? 'این مشخصات برای موبایل شما در سامانه پیدا شد. در صورت صحت تأیید کنید تا رزرو ادامه یابد.'
          : mode === 'complete'
            ? 'نام، نام خانوادگی و کد ملی را تکمیل کنید.'
            : 'برای این موبایل سابقه‌ای نبود. نام، نام خانوادگی و کد ملی را وارد کنید.';

  const submitPhone = async () => {
    setError('');
    setBusy(true);
    try {
      const phone = toAsciiDigits(form.phoneNumber);
      if (phone.length !== 11 || !phone.startsWith('09')) {
        throw new Error('شماره موبایل معتبر نیست (مثال: 09123456789)');
      }
      setForm((prev) => ({ ...prev, phoneNumber: phone }));
      await bookingOtpRequest(phone);
      setOtpCode('');
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

      const res = await bookingOtpVerify({ phoneNumber: phone, code });
      if (!res?.verified || !res.accessToken) {
        throw new Error('تأیید انجام نشد. دوباره تلاش کنید.');
      }

      const firstName = (res.firstName || res.patient?.firstName || '').trim();
      const lastName = (res.lastName || res.patient?.lastName || '').trim();
      const nationalCode = toAsciiDigits(res.nationalCode || res.patient?.nationalCode || '').slice(0, 10);

      const snapshot: PortalBookingAuthResult = {
        accessToken: res.accessToken,
        phoneNumber: res.phoneNumber || phone,
        phoneMasked: res.phoneMasked,
        userId: res.userId,
        expiresAtUtc: res.expiresAtUtc,
        patientId: res.patientId ?? res.patient?.patientId,
        firstName,
        lastName,
        nationalCode,
        isPatient: !!res.isPatient,
        isAuthenticated: true,
      };
      setAuthSnapshot(snapshot);
      setForm({
        phoneNumber: phone,
        firstName,
        lastName,
        nationalCode,
      });

      if (res.isPatient || isCompletePatientProfile({ firstName, lastName, nationalCode })) {
        setStep('confirm');
      } else {
        setStep('profile');
      }
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'کد تأیید نادرست است'));
    } finally {
      setBusy(false);
    }
  };

  const submitProfileOrConfirm = async () => {
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

      // Existing complete patient + unchanged fields after OTP: continue without rewrite.
      if (
        step === 'confirm' &&
        authSnapshot?.isPatient &&
        authSnapshot.firstName?.trim() === form.firstName.trim() &&
        authSnapshot.lastName?.trim() === form.lastName.trim() &&
        toAsciiDigits(authSnapshot.nationalCode) === national &&
        getPortalRagToken()
      ) {
        finish({
          ...authSnapshot,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          nationalCode: national,
          phoneNumber: phone,
          isPatient: true,
          isAuthenticated: true,
          accessToken: getPortalRagToken() || authSnapshot.accessToken,
        });
        return;
      }

      if (!getPortalRagToken()) {
        throw new Error('جلسه ورود منقضی شده است. دوباره کد بگیرید.');
      }

      const res = await bookingCompleteProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalCode: national,
        phoneNumber: phone,
      });
      finish(res);
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'ذخیره مشخصات ناموفق بود'));
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
        <h2 className="portal-auth-modal__title">{title}</h2>
        <p className="portal-auth-modal__lead">{lead}</p>

        {error && <div className="portal-booking__error">{error}</div>}

        {step === 'phone' && (
          <div className="portal-auth-modal__fields">
            <label className="portal-booking__label">شماره موبایل</label>
            <input
              className="portal-booking__input"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phoneNumber}
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
                onClick={() => void submitPhone()}
              >
                {busy ? 'در حال ارسال کد…' : 'ارسال کد تأیید'}
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
                {busy ? 'در حال تأیید…' : 'تأیید کد'}
              </button>
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--outline"
                disabled={busy}
                onClick={() => setStep('phone')}
              >
                ویرایش موبایل
              </button>
            </div>
          </div>
        )}

        {(step === 'profile' || step === 'confirm') && (
          <div className="portal-auth-modal__fields">
            <label className="portal-booking__label">شماره موبایل</label>
            <input className="portal-booking__input" value={form.phoneNumber} disabled />
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
            <div className="portal-booking__actions">
              <button
                type="button"
                className="portal-booking__btn portal-booking__btn--green"
                disabled={busy}
                onClick={() => void submitProfileOrConfirm()}
              >
                {busy
                  ? 'در حال ذخیره…'
                  : step === 'confirm'
                    ? 'تأیید و ادامه رزرو'
                    : 'ذخیره و ادامه رزرو'}
              </button>
              {step === 'confirm' && (
                <button
                  type="button"
                  className="portal-booking__btn portal-booking__btn--outline"
                  disabled={busy}
                  onClick={() => setStep('profile')}
                >
                  ویرایش مشخصات
                </button>
              )}
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
