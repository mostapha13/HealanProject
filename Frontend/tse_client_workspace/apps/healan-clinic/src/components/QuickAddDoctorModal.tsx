import React, { useEffect, useState } from 'react';
import healanApi from '../api/healanApi';
import { buildDoctorPayload } from '../utils/apiPayload';
import { isValidIranNationalCode } from '../utils/nationalCode';
import { HealanModal } from './HealanModal';
import { SearchableSelect } from './SearchableSelect';

export interface QuickAddDoctorForm {
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  medicalGroupTypeId: number;
  companyId: number;
}

const EMPTY_FORM: QuickAddDoctorForm = {
  firstName: '',
  lastName: '',
  nationalCode: '',
  mobile: '',
  medicalGroupTypeId: 0,
  companyId: 0,
};

type FieldErrors = Partial<Record<keyof QuickAddDoctorForm, string>>;

export interface QuickAddDoctorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (doctorId: number) => void;
  onAlert: (msg: unknown) => void;
}

function validate(form: QuickAddDoctorForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'نام الزامی است';
  if (!form.lastName.trim()) errors.lastName = 'نام خانوادگی الزامی است';
  if (!form.nationalCode.trim()) {
    errors.nationalCode = 'کد ملی الزامی است';
  } else if (!isValidIranNationalCode(form.nationalCode.trim())) {
    errors.nationalCode = 'کد ملی نامعتبر است';
  }
  if (!form.mobile.trim()) {
    errors.mobile = 'شماره موبایل الزامی است';
  }
  if (form.medicalGroupTypeId <= 0) errors.medicalGroupTypeId = 'تخصص را انتخاب کنید';
  if (form.companyId <= 0) errors.companyId = 'مرکز درمانی یافت نشد';
  return errors;
}

export function QuickAddDoctorModal({ open, onClose, onSuccess, onAlert }: QuickAddDoctorModalProps) {
  const [form, setForm] = useState<QuickAddDoctorForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [companies, setCompanies] = useState<{ companyId: number; companyName: string }[]>([]);
  const [medicalGroups, setMedicalGroups] = useState<{ key: number; name: string; displayName?: string }[]>([]);

  useEffect(() => {
    if (!open) return;

    setForm(EMPTY_FORM);
    setErrors({});
    setSaving(false);
    setLoadingMeta(true);

    Promise.all([healanApi.companies.listAll(), healanApi.doctors.medicalGroups()])
      .then(([companyList, groups]) => {
        const mappedCompanies = companyList.map((c) => ({
          companyId: c.companyId,
          companyName: c.companyName,
        }));
        setCompanies(mappedCompanies);
        setMedicalGroups(groups);
        setForm((prev) => ({
          ...prev,
          companyId: mappedCompanies[0]?.companyId ?? 0,
        }));
      })
      .catch((err) => onAlert(err))
      .finally(() => setLoadingMeta(false));
  }, [open, onAlert]);

  const update = <K extends keyof QuickAddDoctorForm>(key: K, value: QuickAddDoctorForm[K]) => {
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
      const result = await healanApi.doctors.register(
        buildDoctorPayload({
          doctorId: 0,
          ...form,
          medicalSystemNumber: 0,
        })
      );

      onAlert({ type: 'success', message: 'پزشک با موفقیت ثبت شد و به لیست اضافه شد' });
      onSuccess(result.id);
      onClose();
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const singleCompany = companies.length === 1;

  return (
    <HealanModal
      open={open}
      title="افزودن پزشک جدید"
      subtitle="ثبت سریع پزشک — بلافاصله در لیست پذیرش قابل انتخاب است"
      icon="🩺"
      onClose={onClose}
      width={520}
      footer={
        <div className="healan-modal__footer-actions">
          <button type="button" className="healan-btn healan-btn--outline" onClick={onClose} disabled={saving}>
            انصراف
          </button>
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            onClick={() => void handleSubmit()}
            disabled={saving || loadingMeta}
          >
            {saving ? 'در حال ثبت...' : 'ثبت پزشک'}
          </button>
        </div>
      }
    >
      {loadingMeta ? (
        <div className="healan-modal__loading">در حال بارگذاری...</div>
      ) : companies.length === 0 ? (
        <div className="healan-modal__empty">
          مرکز درمانی در سیستم ثبت نشده است. ابتدا از بخش «اطلاعات پایه» یک مرکز ثبت کنید.
        </div>
      ) : (
        <div className="healan-quick-form">
          <div className="healan-form-field">
            <label htmlFor="qa-doctor-firstName">
              نام <span className="healan-required">*</span>
            </label>
            <input
              id="qa-doctor-firstName"
              autoFocus
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="مثلاً معصومه"
              className={errors.firstName ? 'healan-input--error' : ''}
            />
            {errors.firstName && <span className="healan-field-error">{errors.firstName}</span>}
          </div>

          <div className="healan-form-field">
            <label htmlFor="qa-doctor-lastName">
              نام خانوادگی <span className="healan-required">*</span>
            </label>
            <input
              id="qa-doctor-lastName"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="مثلاً شهرویی"
              className={errors.lastName ? 'healan-input--error' : ''}
            />
            {errors.lastName && <span className="healan-field-error">{errors.lastName}</span>}
          </div>

          <div className="healan-form-field">
            <label htmlFor="qa-doctor-nationalCode">
              کد ملی <span className="healan-required">*</span>
            </label>
            <input
              id="qa-doctor-nationalCode"
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
            <label htmlFor="qa-doctor-mobile">
              موبایل <span className="healan-required">*</span>
            </label>
            <input
              id="qa-doctor-mobile"
              value={form.mobile}
              inputMode="tel"
              onChange={(e) => update('mobile', e.target.value)}
              placeholder="۰۹۱۲xxxxxxx"
              className={errors.mobile ? 'healan-input--error' : ''}
            />
            {errors.mobile && <span className="healan-field-error">{errors.mobile}</span>}
          </div>

          <div className="healan-form-field">
            <label>
              تخصص / گروه پزشکی <span className="healan-required">*</span>
            </label>
            <SearchableSelect
              value={form.medicalGroupTypeId || null}
              onChange={(v) => update('medicalGroupTypeId', v ?? 0)}
              placeholder="انتخاب تخصص"
              options={medicalGroups.map((g) => ({
                value: g.key,
                label: g.displayName ?? g.name ?? String(g.key),
              }))}
            />
            {errors.medicalGroupTypeId && (
              <span className="healan-field-error">{errors.medicalGroupTypeId}</span>
            )}
          </div>

          <div className="healan-form-field">
            <label>
              مرکز درمانی <span className="healan-required">*</span>
            </label>
            {singleCompany ? (
              <input value={companies[0].companyName} readOnly className="healan-input--readonly" />
            ) : (
              <SearchableSelect
                value={form.companyId || null}
                onChange={(v) => update('companyId', v ?? 0)}
                placeholder="انتخاب مرکز"
                options={companies.map((c) => ({
                  value: c.companyId,
                  label: c.companyName,
                }))}
              />
            )}
            {errors.companyId && <span className="healan-field-error">{errors.companyId}</span>}
          </div>
        </div>
      )}
    </HealanModal>
  );
}
