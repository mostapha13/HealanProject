import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { appointmentPatientName, prescriptionDoctorName, prescriptionPatientName } from '../../utils/appointmentDisplay';
import { buildPrescriptionPayload, toDateTimeLocalValue } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanFileUpload } from '../../components/HealanFileUpload';
import { getFileDownloadUrl } from '../../api/fileApi';
import { useLocation } from '@tse/utils';
import { nowDateTimeLocal } from '../../utils/formatJalali';
import { EchoReportFormPanel } from '../../components/EchoReportFormPanel';
import {
  echoHasAnyValue,
  emptyEchoReport,
  mapEchoFromApi,
  type EchoReportForm,
} from '../../utils/echoFields';
import { openEchoPrintWindow, openEchoPrintWindowBlank, writeEchoPrintHtmlToWindow } from '../../utils/printEchoReport';
import { buildEchoPrintPayload } from '../../utils/echoPrintPayload';
import { PatientVisitHistoryDrawer } from '../../components/PatientVisitHistoryDrawer';

/** کلیدهای enum تصویربرداری — عدد مطابق ImageTypeId بک‌اند */
const IMAGE_TYPE_KEY: Record<string, number> = {
  ECG: 1,
  Echocardiography: 2,
  ExerciseStressTest: 3,
  HolterRhythmMonitor: 4,
  AmbulatoryBloodPressureMonitoring: 5,
  MRI: 6,
  GeneralReport: 7,
};

const GENERAL_REPORT_TYPE_ID = 7;
const ECHO_TYPE_ID = 2;

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
const emptyImaging = (): PrescriptionImagingRow => ({
  imageTypeId: GENERAL_REPORT_TYPE_ID,
  notes: '',
  attachmentId: null,
  uploadMeta: null,
});

const initialForm = () => ({
  prescriptionId: 0,
  appointmentId: 0,
  issueDate: nowDateTimeLocal(),
  notes: '',
  prescriptionDrugs: [] as ReturnType<typeof emptyDrug>[],
  labTestRequests: [] as PrescriptionLabRow[],
  imagingRequests: [] as PrescriptionImagingRow[],
  echoReport: emptyEchoReport() as EchoReportForm,
});

type FormState = ReturnType<typeof initialForm>;

function mapDetailToForm(detail: PrescriptionDetail): FormState {
  const drugs =
    detail.prescriptionDrugs
      ?.filter((d) => d.drugName?.trim())
      .map((d) => ({
        drugName: d.drugName ?? '',
        dosage: d.dosage ?? '',
        usageInstructions: d.usageInstructions ?? '',
      })) ?? [];
  const labs =
    detail.labTestRequests
      ?.filter((l) => l.labTestType?.trim())
      .map((l) => ({
        labTestType: l.labTestType ?? '',
        notes: l.notes ?? '',
        attachmentId: l.attachmentId ?? l.attachment?.fileId ?? null,
        uploadMeta: l.attachment?.fileId
          ? { fileId: l.attachment.fileId, fileName: l.attachment.fileName ?? 'پیوست', link: l.attachment.link }
          : l.attachmentId
            ? { fileId: l.attachmentId, fileName: l.attachment?.fileName ?? 'پیوست' }
            : null,
      })) ?? [];
  const imaging =
    detail.imagingRequests
      ?.filter((i) => parseImageTypeId(i.imageTypeId) > 0)
      .map((i) => ({
        imageTypeId: parseImageTypeId(i.imageTypeId),
        notes: i.notes ?? '',
        attachmentId: i.attachmentId ?? i.attachment?.fileId ?? null,
        uploadMeta: i.attachment?.fileId
          ? { fileId: i.attachment.fileId, fileName: i.attachment.fileName ?? 'پیوست', link: i.attachment.link }
          : i.attachmentId
            ? { fileId: i.attachmentId, fileName: i.attachment?.fileName ?? 'پیوست' }
            : null,
      })) ?? [];

  return {
    prescriptionId: detail.prescriptionId,
    appointmentId: detail.appointmentId,
    issueDate: toDateTimeLocalValue(detail.issueDate) || nowDateTimeLocal(),
    notes: detail.notes ?? '',
    prescriptionDrugs: drugs,
    labTestRequests: labs,
    imagingRequests: imaging,
    echoReport: mapEchoFromApi(detail.echoReport as Record<string, unknown> | null),
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
  const [newDrug, setNewDrug] = useState(emptyDrug);
  const [newLab, setNewLab] = useState(emptyLab);
  const [newImaging, setNewImaging] = useState(emptyImaging);
  const [labDraftKey, setLabDraftKey] = useState(0);
  const [imagingDraftKey, setImagingDraftKey] = useState(0);
  const [historyPatient, setHistoryPatient] = useState<{ patientId: number; patientName: string } | null>(null);

  const selectedAppointment = useMemo(
    () => appointments.find((a) => a.appointmentId === form.appointmentId),
    [appointments, form.appointmentId]
  );

  const resetLabDraft = () => {
    setNewLab(emptyLab());
    setLabDraftKey((k) => k + 1);
  };

  const resetImagingDraft = () => {
    setNewImaging(emptyImaging());
    setImagingDraftKey((k) => k + 1);
  };

  const imageTypeLabel = (id: number) => {
    const match = imageTypes.find((t) => t.key === id);
    return match?.displayName ?? match?.name ?? (id > 0 ? String(id) : '—');
  };

  const sortedImageTypes = useMemo(() => {
    const list = [...imageTypes];
    list.sort((a, b) => {
      if (a.key === GENERAL_REPORT_TYPE_ID) return -1;
      if (b.key === GENERAL_REPORT_TYPE_ID) return 1;
      return a.key - b.key;
    });
    return list;
  }, [imageTypes]);

  const showEchoForm =
    form.imagingRequests.some((i) => i.imageTypeId === ECHO_TYPE_ID) ||
    newImaging.imageTypeId === ECHO_TYPE_ID ||
    echoHasAnyValue(form.echoReport);

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

  const openPrescription = useCallback(
    async (prescriptionId: number) => {
      try {
        const detail = await healanApi.prescriptions.info(prescriptionId);
        setForm(mapDetailToForm(detail));
        setNewDrug(emptyDrug());
        resetLabDraft();
        resetImagingDraft();
        setShowForm(true);
      } catch (err) {
        onAlert(err);
      }
    },
    [onAlert]
  );

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
            setNewDrug(emptyDrug());
            resetLabDraft();
            resetImagingDraft();
            setShowForm(true);
          }
        } catch (err) {
          onAlert(err);
        }
      }
    };

    void openFromQuery();
  }, [location.search, openPrescription, onAlert]);

  const addDrug = () => {
    if (!newDrug.drugName.trim()) {
      onAlert({ type: 'error', message: 'نام دارو را وارد کنید' });
      return;
    }
    setForm((prev) => ({ ...prev, prescriptionDrugs: [...prev.prescriptionDrugs, { ...newDrug }] }));
    setNewDrug(emptyDrug());
  };

  const addLab = () => {
    if (!newLab.labTestType.trim()) {
      onAlert({ type: 'error', message: 'نوع آزمایش را وارد کنید' });
      return;
    }
    setForm((prev) => ({
      ...prev,
      labTestRequests: [
        ...prev.labTestRequests,
        {
          ...newLab,
          attachmentId: newLab.uploadMeta?.fileId ?? newLab.attachmentId ?? null,
          uploadMeta: newLab.uploadMeta ? { ...newLab.uploadMeta } : null,
        },
      ],
    }));
    resetLabDraft();
  };

  const addImaging = () => {
    if (newImaging.imageTypeId <= 0) {
      onAlert({ type: 'error', message: 'نوع تصویربرداری را انتخاب کنید' });
      return;
    }
    setForm((prev) => ({
      ...prev,
      imagingRequests: [
        ...prev.imagingRequests,
        {
          ...newImaging,
          attachmentId: newImaging.uploadMeta?.fileId ?? newImaging.attachmentId ?? null,
          uploadMeta: newImaging.uploadMeta ? { ...newImaging.uploadMeta } : null,
        },
      ],
    }));
    resetImagingDraft();
  };

  const printEchoById = async (prescriptionId: number) => {
    try {
      const w = openEchoPrintWindowBlank();
      if (!w) {
        onAlert({ type: 'error', message: 'پنجره چاپ باز نشد (Popup blocker). اجازه پنجره‌های جدید را فعال کن.' });
        return;
      }
      const data = await healanApi.prescriptions.echoPrintData(prescriptionId);
      writeEchoPrintHtmlToWindow(w, buildEchoPrintPayload(data));
    } catch (err) {
      onAlert(err);
    }
  };

  const handleSave = async () => {
    if (form.appointmentId <= 0) {
      onAlert({ type: 'error', message: 'نوبت / ویزیت را انتخاب کنید' });
      return;
    }

    // دارو و آزمایش اختیاری‌اند؛ نسخه فقط با یادداشت/اکو هم قابل ذخیره است
    const hasImaging = form.imagingRequests.length > 0;
    const hasEcho = echoHasAnyValue(form.echoReport);
    const imagingForSave =
      hasEcho && !form.imagingRequests.some((i) => i.imageTypeId === ECHO_TYPE_ID)
        ? [...form.imagingRequests, { imageTypeId: ECHO_TYPE_ID, notes: '', attachmentId: null }]
        : form.imagingRequests;

    setSaving(true);
    try {
      const result = await healanApi.prescriptions.register(
        buildPrescriptionPayload({
          ...form,
          imagingRequests: imagingForSave,
          includeImaging: imagingForSave.length > 0 || hasImaging,
          echoReport: hasEcho ? form.echoReport : null,
        })
      );
      const savedId =
        Number((result as { id?: number; prescriptionId?: number })?.id) ||
        Number((result as { prescriptionId?: number })?.prescriptionId) ||
        form.prescriptionId;

      setShowForm(false);
      setForm(initialForm());
      setNewDrug(emptyDrug());
      resetLabDraft();
      resetImagingDraft();
      await load();
      onAlert({ type: 'success', message: 'نسخه با موفقیت ذخیره شد' });

      if (hasEcho && savedId > 0) {
        // چاپ اکو فقط بعد از ذخیره، از لیست نسخه/صف/پرونده ویزیت
      }
    } catch (err) {
      onAlert(err);
    } finally {
      setSaving(false);
    }
  };

  const attachmentCell = (row: { uploadMeta?: PrescriptionLabRow['uploadMeta']; attachmentId?: string | null }) => {
    const fileId = row.uploadMeta?.fileId ?? row.attachmentId ?? null;
    if (!fileId) return <>—</>;

    const url = row.uploadMeta?.link ?? getFileDownloadUrl(fileId);
    const name = row.uploadMeta?.fileName || 'مشاهده فایل';
    const isImage =
      String(row.uploadMeta?.fileType ?? '').toLowerCase() === 'image' ||
      /\.(jpg|jpeg|png|bmp|webp|gif)$/i.test(name);

    if (isImage) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="healan-attachment-preview">
          <img src={url} alt={name} />
          <span>{name}</span>
        </a>
      );
    }

    return (
      <a href={url} target="_blank" rel="noreferrer">
        {name}
      </a>
    );
  };

  return (
    <>
      <PageHeader
        title="نسخه‌های پزشکی"
        subtitle="دارو و آزمایش اختیاری — تصویربرداری و گزارش اکو"
        action={
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            onClick={() => {
              setForm(initialForm());
              setNewDrug(emptyDrug());
              resetLabDraft();
              resetImagingDraft();
              setShowForm(true);
            }}
          >
            + نسخه جدید
          </button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div
            className="healan-card__header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
          >
            <h3>{form.prescriptionId > 0 ? 'ویرایش نسخه' : 'ثبت نسخه'}</h3>
            {selectedAppointment?.patientHasVisitHistory && selectedAppointment.patientId > 0 ? (
              <button
                type="button"
                className="healan-btn healan-btn--outline healan-btn--sm"
                onClick={() =>
                  setHistoryPatient({
                    patientId: selectedAppointment.patientId,
                    patientName: appointmentPatientName(selectedAppointment),
                  })
                }
              >
                مشاهده سوابق بیمار
              </button>
            ) : null}
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

            <div className="healan-prescription-panel">
              <h4 className="healan-prescription-panel__title">داروها (اختیاری)</h4>
              <div className="healan-prescription-add healan-prescription-add--drugs">
                <input placeholder="نام دارو" value={newDrug.drugName} onChange={(e) => setNewDrug({ ...newDrug, drugName: e.target.value })} />
                <input placeholder="دوز" value={newDrug.dosage} onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })} />
                <input
                  placeholder="دستور مصرف"
                  value={newDrug.usageInstructions}
                  onChange={(e) => setNewDrug({ ...newDrug, usageInstructions: e.target.value })}
                />
                <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={addDrug}>
                  افزودن
                </button>
              </div>
              <div className="healan-prescription-table-wrap">
                {form.prescriptionDrugs.length === 0 ? (
                  <div className="healan-prescription-empty">هنوز دارویی ثبت نشده</div>
                ) : (
                  <table className="healan-table">
                    <thead>
                      <tr>
                        <th>نام دارو</th>
                        <th>دوز</th>
                        <th>دستور مصرف</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.prescriptionDrugs.map((drug, index) => (
                        <tr key={`drug-${index}`}>
                          <td>{drug.drugName}</td>
                          <td>{drug.dosage || '—'}</td>
                          <td>{drug.usageInstructions || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="healan-btn healan-btn--outline healan-btn--sm"
                              onClick={() =>
                                setForm({ ...form, prescriptionDrugs: form.prescriptionDrugs.filter((_, i) => i !== index) })
                              }
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="healan-prescription-panel">
              <h4 className="healan-prescription-panel__title">آزمایش‌ها (اختیاری)</h4>
              <div key={`lab-draft-${labDraftKey}`} className="healan-prescription-add healan-prescription-add--labs">
                <input
                  placeholder="نوع آزمایش"
                  value={newLab.labTestType}
                  onChange={(e) => setNewLab((prev) => ({ ...prev, labTestType: e.target.value }))}
                />
                <input placeholder="یادداشت" value={newLab.notes} onChange={(e) => setNewLab((prev) => ({ ...prev, notes: e.target.value }))} />
                <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={addLab}>
                  افزودن
                </button>
                <div className="healan-prescription-add__upload">
                  <HealanFileUpload
                    key={`lab-upload-${labDraftKey}`}
                    value={newLab.uploadMeta}
                    onChange={(meta) => setNewLab((prev) => ({ ...prev, uploadMeta: meta, attachmentId: meta?.fileId ?? null }))}
                    onError={onAlert}
                    label="پیوست نتیجه آزمایش (اختیاری)"
                  />
                </div>
              </div>
              <div className="healan-prescription-table-wrap">
                {form.labTestRequests.length === 0 ? (
                  <div className="healan-prescription-empty">هنوز آزمایشی ثبت نشده</div>
                ) : (
                  <table className="healan-table">
                    <thead>
                      <tr>
                        <th>نوع آزمایش</th>
                        <th>یادداشت</th>
                        <th>پیوست</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.labTestRequests.map((lab, index) => (
                        <tr key={`lab-${index}`}>
                          <td>{lab.labTestType}</td>
                          <td>{lab.notes || '—'}</td>
                          <td>{attachmentCell(lab)}</td>
                          <td>
                            <button
                              type="button"
                              className="healan-btn healan-btn--outline healan-btn--sm"
                              onClick={() =>
                                setForm({ ...form, labTestRequests: form.labTestRequests.filter((_, i) => i !== index) })
                              }
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="healan-prescription-panel">
              <h4 className="healan-prescription-panel__title">تصویربرداری</h4>
              <div key={`imaging-draft-${imagingDraftKey}`} className="healan-prescription-add healan-prescription-add--imaging">
                <SearchableSelect
                  value={newImaging.imageTypeId}
                  onChange={(v) => setNewImaging((prev) => ({ ...prev, imageTypeId: v ?? GENERAL_REPORT_TYPE_ID }))}
                  placeholder="نوع تصویربرداری"
                  options={sortedImageTypes.map((t) => ({
                    value: t.key,
                    label: t.displayName ?? t.name ?? String(t.key),
                  }))}
                />
                <input
                  placeholder="یادداشت"
                  value={newImaging.notes}
                  onChange={(e) => setNewImaging((prev) => ({ ...prev, notes: e.target.value }))}
                />
                <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={addImaging}>
                  افزودن
                </button>
                <div className="healan-prescription-add__upload">
                  <HealanFileUpload
                    key={`imaging-upload-${imagingDraftKey}`}
                    value={newImaging.uploadMeta}
                    onChange={(meta) => setNewImaging((prev) => ({ ...prev, uploadMeta: meta, attachmentId: meta?.fileId ?? null }))}
                    onError={onAlert}
                    label="پیوست تصویر (مثلاً عکس نوار قلب)"
                  />
                </div>
              </div>
              <div className="healan-prescription-table-wrap">
                {form.imagingRequests.length === 0 ? (
                  <div className="healan-prescription-empty">هنوز تصویربرداری ثبت نشده</div>
                ) : (
                  <table className="healan-table">
                    <thead>
                      <tr>
                        <th>نوع</th>
                        <th>یادداشت</th>
                        <th>پیوست</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.imagingRequests.map((img, index) => (
                        <tr key={`img-${index}`}>
                          <td>{imageTypeLabel(img.imageTypeId)}</td>
                          <td>{img.notes || '—'}</td>
                          <td>{attachmentCell(img)}</td>
                          <td>
                            <button
                              type="button"
                              className="healan-btn healan-btn--outline healan-btn--sm"
                              onClick={() =>
                                setForm({ ...form, imagingRequests: form.imagingRequests.filter((_, i) => i !== index) })
                              }
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {showEchoForm && (
              <EchoReportFormPanel value={form.echoReport} onChange={(echoReport) => setForm({ ...form, echoReport })} />
            )}

            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>یادداشت پزشک</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={handleSave}>
                {saving ? 'در حال ذخیره...' : 'ذخیره نسخه'}
              </button>
              {form.prescriptionId > 0 && echoHasAnyValue(form.echoReport) && (
                <button type="button" className="healan-btn healan-btn--outline" onClick={() => void printEchoById(form.prescriptionId)}>
                  چاپ اکو
                </button>
              )}
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {historyPatient && (
        <PatientVisitHistoryDrawer
          patientId={historyPatient.patientId}
          patientName={historyPatient.patientName}
          onAlert={onAlert}
          onClose={() => setHistoryPatient(null)}
        />
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
                    <td>{prescriptionPatientName(p, appointments)}</td>
                    <td>{prescriptionDoctorName(p, appointments)}</td>
                    <td>{p.notes ?? '—'}</td>
                    <td>
                      <div className="healan-actions">
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => void openPrescription(p.prescriptionId)}
                        >
                          ویرایش / پیوست
                        </button>
                        {p.hasEchoReport ? (
                          <button
                            type="button"
                            className="healan-btn healan-btn--primary healan-btn--sm"
                            onClick={() => void printEchoById(p.prescriptionId)}
                          >
                            چاپ اکو
                          </button>
                        ) : null}
                      </div>
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
