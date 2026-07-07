import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type {
  AppointmentSummary,
  PrescriptionDetail,
  PrescriptionImagingRow,
  PrescriptionLabRow,
  PrescriptionSummary,
} from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { appointmentPatientName } from '../../utils/appointmentDisplay';
import { buildPrescriptionPayload, toDateTimeLocalValue } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanFileUpload } from '../../components/HealanFileUpload';
import { useLocation } from '@tse/utils';
import { nowDateTimeLocal } from '../../utils/formatJalali';

const IMAGE_TYPE_KEY: Record<string, number> = {
  ECG: 1,
  Echocardiography: 2,
  ExerciseStressTest: 3,
  HolterRhythmMonitor: 4,
  AmbulatoryBloodPressureMonitoring: 5,
  MRI: 6,
};

function parseImageTypeId(value: unknown): number {
  if (typeof value === 'number' && value > 0) return value;
  if (typeof value === 'string') {
    if (IMAGE_TYPE_KEY[value]) return IMAGE_TYPE_KEY[value];
    const num = parseInt(value, 10);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  return 0;
}

const emptyDrug = () => ({ drugName: '', dosage: '', usageInstructions: '' });
const emptyLab = (): PrescriptionLabRow => ({ labTestType: '', notes: '', attachmentId: null, uploadMeta: null });
const emptyImaging = (): PrescriptionImagingRow => ({ imageTypeId: 0, notes: '', attachmentId: null, uploadMeta: null });

const initialForm = () => ({
  prescriptionId: 0,
  appointmentId: 0,
  issueDate: nowDateTimeLocal(),
  notes: '',
  prescriptionDrugs: [emptyDrug()],
  labTestRequests: [emptyLab()],
  imagingRequests: [emptyImaging()],
});

type FormState = ReturnType<typeof initialForm>;

function mapDetailToForm(detail: PrescriptionDetail): FormState {
  const drugs = detail.prescriptionDrugs?.filter((d) => d.drugName?.trim()).map((d) => ({
    drugName: d.drugName ?? '',
    dosage: d.dosage ?? '',
    usageInstructions: d.usageInstructions ?? '',
  }));
  const labs = detail.labTestRequests?.filter((l) => l.labTestType?.trim()).map((l) => ({
    labTestType: l.labTestType ?? '',
    notes: l.notes ?? '',
    attachmentId: l.attachmentId ?? l.attachment?.fileId ?? null,
    uploadMeta: l.attachment?.fileId
      ? { fileId: l.attachment.fileId, fileName: l.attachment.fileName ?? 'پیوست', link: l.attachment.link }
      : l.attachmentId
        ? { fileId: l.attachmentId, fileName: l.attachment?.fileName ?? 'پیوست' }
        : null,
  }));
  const imaging = detail.imagingRequests?.filter((i) => parseImageTypeId(i.imageTypeId) > 0).map((i) => ({
    imageTypeId: parseImageTypeId(i.imageTypeId),
    notes: i.notes ?? '',
    attachmentId: i.attachmentId ?? i.attachment?.fileId ?? null,
    uploadMeta: i.attachment?.fileId
      ? { fileId: i.attachment.fileId, fileName: i.attachment.fileName ?? 'پیوست', link: i.attachment.link }
      : i.attachmentId
        ? { fileId: i.attachmentId, fileName: i.attachment?.fileName ?? 'پیوست' }
        : null,
  }));

  return {
    prescriptionId: detail.prescriptionId,
    appointmentId: detail.appointmentId,
    issueDate: toDateTimeLocalValue(detail.issueDate) || nowDateTimeLocal(),
    notes: detail.notes ?? '',
    prescriptionDrugs: drugs?.length ? drugs : [emptyDrug()],
    labTestRequests: labs?.length ? labs : [emptyLab()],
    imagingRequests: imaging?.length ? imaging : [emptyImaging()],
  };
}

function PrescriptionsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const location = useLocation();
  const [items, setItems] = useState<PrescriptionSummary[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageTypes, setImageTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.prescriptions.listAll();
      setItems(res);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  const openPrescription = useCallback(async (prescriptionId: number) => {
    try {
      const detail = await healanApi.prescriptions.info(prescriptionId);
      setForm(mapDetailToForm(detail));
      setShowForm(true);
    } catch (err) {
      onAlert(err);
    }
  }, [onAlert]);

  useEffect(() => {
    load();
    healanApi.appointments.listAll().then(setAppointments).catch(() => {});
    healanApi.prescriptions.imageTypes().then(setImageTypes).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const appointmentId = params.get('appointmentId');
    const prescriptionId = params.get('prescriptionId');

    const openFromQuery = async () => {
      if (prescriptionId) {
        await openPrescription(+prescriptionId);
        return;
      }
      if (appointmentId) {
        try {
          const list = await healanApi.prescriptions.listAll();
          const existing = list.find((p) => p.appointmentId === +appointmentId);
          if (existing) {
            await openPrescription(existing.prescriptionId);
          } else {
            setForm({ ...initialForm(), appointmentId: +appointmentId });
            setShowForm(true);
          }
        } catch (err) {
          onAlert(err);
        }
      }
    };

    void openFromQuery();
  }, [location.search, openPrescription, onAlert]);

  const updateDrug = (index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      prescriptionDrugs: prev.prescriptionDrugs.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    }));
  };

  const updateLab = (index: number, field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      labTestRequests: prev.labTestRequests.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const updateLabAttachment = (index: number, meta: PrescriptionLabRow['uploadMeta']) => {
    setForm((prev) => ({
      ...prev,
      labTestRequests: prev.labTestRequests.map((l, i) =>
        i === index
          ? { ...l, uploadMeta: meta, attachmentId: meta?.fileId ?? null }
          : l
      ),
    }));
  };

  const updateImaging = (index: number, field: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      imagingRequests: prev.imagingRequests.map((img, i) => (i === index ? { ...img, [field]: value } : img)),
    }));
  };

  const updateImagingAttachment = (index: number, meta: PrescriptionImagingRow['uploadMeta']) => {
    setForm((prev) => ({
      ...prev,
      imagingRequests: prev.imagingRequests.map((img, i) =>
        i === index
          ? { ...img, uploadMeta: meta, attachmentId: meta?.fileId ?? null }
          : img
      ),
    }));
  };

  const handleSave = async () => {
    if (form.appointmentId <= 0) {
      onAlert({ type: 'error', message: 'نوبت / ویزیت را انتخاب کنید' });
      return;
    }
    const hasDrug = form.prescriptionDrugs.some((d) => d.drugName.trim());
    const hasLab = form.labTestRequests.some((l) => l.labTestType.trim());
    const hasImaging = form.imagingRequests.some((i) => i.imageTypeId > 0);
    if (!hasDrug && !hasLab && !hasImaging) {
      onAlert({ type: 'error', message: 'حداقل یک دارو، آزمایش یا تصویربرداری وارد کنید' });
      return;
    }
    setSaving(true);
    try {
      await healanApi.prescriptions.register(buildPrescriptionPayload({ ...form, includeImaging: hasImaging }));
      setShowForm(false);
      setForm(initialForm());
      await load();
      onAlert({ type: 'success', message: 'نسخه با موفقیت ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="نسخه‌های پزشکی"
        subtitle="ثبت دارو، آزمایش و تصویربرداری — پیوست تصاویر توسط منشی"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => { setForm(initialForm()); setShowForm(true); }}>
            + نسخه جدید
          </button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header">
            <h3>{form.prescriptionId > 0 ? 'ویرایش نسخه' : 'ثبت نسخه'}</h3>
          </div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>نوبت / ویزیت</label>
                <SearchableSelect
                  value={form.appointmentId}
                  onChange={(v) => setForm({ ...form, appointmentId: v ?? 0 })}
                  placeholder="انتخاب نوبت"
                  options={appointments.map((a) => ({
                    value: a.appointmentId,
                    label: `${appointmentPatientName(a)} — ${convertDateAndTimeToJalali(a.appointmentDate)}`,
                  }))}
                />
              </div>
              <div className="healan-form-field">
                <label>تاریخ صدور</label>
                <input type="datetime-local" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </div>
            </div>

            <div className="healan-list-section">
              <div className="healan-list-section__header">
                <h4>لیست داروها</h4>
                <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, prescriptionDrugs: [...form.prescriptionDrugs, emptyDrug()] })}>+ دارو</button>
              </div>
              {form.prescriptionDrugs.map((drug, index) => (
                <div key={`drug-${index}`} className="healan-inline-row">
                  <input placeholder="نام دارو" value={drug.drugName} onChange={(e) => updateDrug(index, 'drugName', e.target.value)} />
                  <input placeholder="دوز" value={drug.dosage} onChange={(e) => updateDrug(index, 'dosage', e.target.value)} />
                  <input placeholder="دستور مصرف" value={drug.usageInstructions} onChange={(e) => updateDrug(index, 'usageInstructions', e.target.value)} />
                  {form.prescriptionDrugs.length > 1 && (
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, prescriptionDrugs: form.prescriptionDrugs.filter((_, i) => i !== index) })}>حذف</button>
                  )}
                </div>
              ))}
            </div>

            <div className="healan-list-section">
              <div className="healan-list-section__header">
                <h4>لیست آزمایش‌ها</h4>
                <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, labTestRequests: [...form.labTestRequests, emptyLab()] })}>+ آزمایش</button>
              </div>
              {form.labTestRequests.map((lab, index) => (
                <div key={`lab-${index}`} className="healan-prescription-row">
                  <div className="healan-inline-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                    <input placeholder="نوع آزمایش" value={lab.labTestType} onChange={(e) => updateLab(index, 'labTestType', e.target.value)} />
                    <input placeholder="یادداشت" value={lab.notes} onChange={(e) => updateLab(index, 'notes', e.target.value)} />
                    {form.labTestRequests.length > 1 && (
                      <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, labTestRequests: form.labTestRequests.filter((_, i) => i !== index) })}>حذف</button>
                    )}
                  </div>
                  <HealanFileUpload
                    value={lab.uploadMeta}
                    onChange={(meta) => updateLabAttachment(index, meta)}
                    onError={onAlert}
                    label="پیوست نتیجه آزمایش (اختیاری)"
                  />
                </div>
              ))}
            </div>

            <div className="healan-list-section">
              <div className="healan-list-section__header">
                <h4>لیست تصویربرداری (نوار قلب، اکو، تست ورزش و ...)</h4>
                <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, imagingRequests: [...form.imagingRequests, emptyImaging()] })}>+ تصویربرداری</button>
              </div>
              {form.imagingRequests.map((img, index) => (
                <div key={`img-${index}`} className="healan-prescription-row">
                  <div className="healan-inline-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                    <SearchableSelect
                      value={img.imageTypeId}
                      onChange={(v) => updateImaging(index, 'imageTypeId', v ?? 0)}
                      placeholder="نوع تصویربرداری"
                      options={imageTypes.map((t) => ({
                        value: t.key,
                        label: t.displayName ?? t.name ?? String(t.key),
                      }))}
                    />
                    <input placeholder="یادداشت" value={img.notes} onChange={(e) => updateImaging(index, 'notes', e.target.value)} />
                    {form.imagingRequests.length > 1 && (
                      <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => setForm({ ...form, imagingRequests: form.imagingRequests.filter((_, i) => i !== index) })}>حذف</button>
                    )}
                  </div>
                  <HealanFileUpload
                    value={img.uploadMeta}
                    onChange={(meta) => updateImagingAttachment(index, meta)}
                    onError={onAlert}
                    label="پیوست تصویر (مثلاً عکس نوار قلب)"
                  />
                </div>
              ))}
            </div>

            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>یادداشت پزشک</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              فایل‌ها از طریق FileManager آپلود می‌شوند و به نسخه پیوست می‌گردند.
            </p>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={handleSave}>
                {saving ? 'در حال ذخیره...' : 'ذخیره نسخه'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">نسخه‌ای ثبت نشده است</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>تاریخ</th>
                  <th>بیمار</th>
                  <th>پزشک</th>
                  <th>یادداشت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.prescriptionId}>
                    <td>{p.issueDate ? <span>{convertDateAndTimeToJalali(p.issueDate)}</span> : '—'}</td>
                    <td>{p.patientName ?? '—'}</td>
                    <td>{p.doctorName ?? '—'}</td>
                    <td>{p.notes ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        onClick={() => void openPrescription(p.prescriptionId)}
                      >
                        ویرایش / پیوست
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(PrescriptionsPage);
