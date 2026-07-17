import React, { useEffect, useState } from 'react';
import healanApi from '../api/healanApi';
import { buildPatientPayload } from '../utils/apiPayload';
import { isValidIranNationalCode } from '../utils/nationalCode';
import { HealanModal } from './HealanModal';
import { JalaliDateInput } from './JalaliDateInput';

export interface QuickAddPatientForm {
  firstName: string;
  lastName: string;
  nationalCode: string;
  phoneNumber: string;
  birthdate: string;
}

const EMPTY_FORM: QuickAddPatientForm = {
  firstName: '',
  lastName: '',
  nationalCode: '',
  phoneNumber: '',
  birthdate: '',
};

type FieldErrors = Partial<Record<keyof QuickAddPatientForm, string>>;

export interface QuickAddPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (patientId: number) => void;
  onAlert: (msg: unknown) => void;
  initialValues?: Partial<QuickAddPatientForm>;
}

function validate(form: QuickAddPatientForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'نام الزامی است';
  if (!form.lastName.trim()) errors.lastName = 'نام خانوادگی الزامی است';
  if (!form.nationalCode.trim()) {
    errors.nationalCode = 'کد ملی الزامی است';
  } else if (!isValidIranNationalCode(form.nationalCode.trim())) {
    errors.nationalCode = 'کد ملی نامعتبر است';
  }
  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = 'شماره موبایل الزامی است';
  }
  return errors;
}

export function QuickAddPatientModal({
  open,
  onClose,
  onSuccess,
  onAlert,
  initialValues,
}: QuickAddPatientModalProps) {
  const [form, setForm] = useState<QuickAddPatientForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, ...initialValues });
    setErrors({});
    setSaving(false);
    // Only hydrate when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = (key: keyof QuickAddPatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await healanApi.patients.register(
        buildPatientPayload({
          patientId: 0,
          userId: 0,
          ...form,
        })
      );

      if (result?.initialPassword) {
        onAlert({
          type: 'success',
          message: 'بیمار ثبت شد و به لیست اضافه شد',
          description: `ورود: ${result.loginUserName ?? form.phoneNumber} / رمز: ${result.initialPassword}`,
        });
      } else {
        onAlert({ type: 'success', message: 'بیمار با موفقیت ثبت شد و به لیست اضافه شد' });
      }

      onSuccess(result.id);
      onClose();
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HealanModal
      open={open}
      title="افزودن بیمار جدید"
      subtitle="ثبت سریع با حداقل اطلاعات — بیمار بلافاصله در لیست پذیرش قابل انتخاب است"
      icon="👤"
      onClose={onClose}
      width={480}
      footer={
        <div className="healan-modal__footer-actions">
          <button type="button" className="healan-btn healan-btn--outline" onClick={onClose} disabled={saving}>
            انصراف
          </button>
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? 'در حال ثبت...' : 'ثبت بیمار'}
          </button>
        </div>
      }
    >
      <div className="healan-quick-form">
        <div className="healan-form-field">
          <label htmlFor="qa-patient-firstName">
            نام <span className="healan-required">*</span>
          </label>
          <input
            id="qa-patient-firstName"
            autoFocus
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            placeholder="مثلاً علی"
            className={errors.firstName ? 'healan-input--error' : ''}
          />
          {errors.firstName && <span className="healan-field-error">{errors.firstName}</span>}
        </div>

        <div className="healan-form-field">
          <label htmlFor="qa-patient-lastName">
            نام خانوادگی <span className="healan-required">*</span>
          </label>
          <input
            id="qa-patient-lastName"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            placeholder="مثلاً محمدی"
            className={errors.lastName ? 'healan-input--error' : ''}
          />
          {errors.lastName && <span className="healan-field-error">{errors.lastName}</span>}
        </div>

        <div className="healan-form-field">
          <label htmlFor="qa-patient-nationalCode">
            کد ملی <span className="healan-required">*</span>
          </label>
          <input
            id="qa-patient-nationalCode"
            value={form.nationalCode}
            maxLength={10}
            inputMode="numeric"
            onChange={(e) => update('nationalCode', e.target.value.replace(/\D/g, ''))}
            placeholder="۱۰ رقم"
            className={errors.nationalCode ? 'healan-input--error' : ''}
          />
          {errors.nationalCode && <span className="healan-field-error">{errors.nationalCode}</span>}
        </div>

        <div className="healan-form-field">
          <label htmlFor="qa-patient-phone">
            موبایل <span className="healan-required">*</span>
          </label>
          <input
            id="qa-patient-phone"
            value={form.phoneNumber}
            inputMode="tel"
            onChange={(e) => update('phoneNumber', e.target.value)}
            placeholder="۰۹۱۲xxxxxxx"
            className={errors.phoneNumber ? 'healan-input--error' : ''}
          />
          {errors.phoneNumber && <span className="healan-field-error">{errors.phoneNumber}</span>}
        </div>

        <div className="healan-form-field">
          <label>تاریخ تولد (شمسی)</label>
          <JalaliDateInput
            value={form.birthdate}
            onChange={(birthdate) => update('birthdate', birthdate)}
            placeholder="انتخاب تاریخ تولد"
            calendarPopperPosition="top"
          />
        </div>
      </div>
    </HealanModal>
  );
}
