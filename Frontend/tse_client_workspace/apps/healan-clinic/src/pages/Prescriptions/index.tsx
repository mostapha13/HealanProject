import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { AppointmentSummary, PrescriptionSummary } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';

function PrescriptionsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<PrescriptionSummary[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageTypes, setImageTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);
  const [form, setForm] = useState({
    prescriptionId: 0,
    appointmentId: 0,
    issueDate: new Date().toISOString().slice(0, 16),
    notes: '',
    prescriptionDrugs: [{ drugName: '', dosage: '', usageInstructions: '' }],
    labTestRequests: [{ labTestType: '', notes: '' }],
    imagingRequests: [{ imageTypeId: 1, notes: '' }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.prescriptions.list({ pageNumber: 1, pageSize: 50 });
      setItems(res.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    healanApi.appointments.list({ pageNumber: 1, pageSize: 100 }).then((r) => setAppointments(r.items ?? [])).catch(() => {});
    healanApi.prescriptions.imageTypes().then(setImageTypes).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.prescriptions.register({
        ...form,
        issueDate: new Date(form.issueDate).toISOString(),
        prescriptionDrugs: form.prescriptionDrugs.filter((d) => d.drugName),
        labTestRequests: form.labTestRequests.filter((l) => l.labTestType),
        imagingRequests: form.imagingRequests.filter((i) => i.notes || i.imageTypeId),
      });
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="نسخه‌های پزشکی"
        subtitle="ثبت دارو، آزمایش و تصویربرداری"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ نسخه جدید</button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header"><h3>ثبت نسخه</h3></div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>نوبت / ویزیت</label>
                <select value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: +e.target.value })}>
                  <option value={0}>انتخاب نوبت</option>
                  {appointments.map((a) => (
                    <option key={a.appointmentId} value={a.appointmentId}>
                      {a.patientName} — {convertDateAndTimeToJalali(a.appointmentDate)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="healan-form-field">
                <label>تاریخ صدور</label>
                <input type="datetime-local" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </div>
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>دارو</label>
              <input placeholder="نام دارو" value={form.prescriptionDrugs[0].drugName} onChange={(e) => setForm({ ...form, prescriptionDrugs: [{ ...form.prescriptionDrugs[0], drugName: e.target.value }] })} />
              <input placeholder="دوز" style={{ marginTop: '0.5rem' }} value={form.prescriptionDrugs[0].dosage} onChange={(e) => setForm({ ...form, prescriptionDrugs: [{ ...form.prescriptionDrugs[0], dosage: e.target.value }] })} />
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>آزمایش</label>
              <input placeholder="نوع آزمایش" value={form.labTestRequests[0].labTestType} onChange={(e) => setForm({ ...form, labTestRequests: [{ ...form.labTestRequests[0], labTestType: e.target.value }] })} />
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>تصویربرداری</label>
              <select value={form.imagingRequests[0].imageTypeId} onChange={(e) => setForm({ ...form, imagingRequests: [{ ...form.imagingRequests[0], imageTypeId: +e.target.value }] })}>
                {imageTypes.map((t) => (
                  <option key={t.key} value={t.key}>{t.displayName ?? t.name}</option>
                ))}
              </select>
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>یادداشت</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ذخیره نسخه</button>
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
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.prescriptionId}>
                    <td>{p.issueDate ? convertDateAndTimeToJalali(p.issueDate) : '—'}</td>
                    <td>{p.patientName ?? '—'}</td>
                    <td>{p.doctorName ?? '—'}</td>
                    <td>{p.notes ?? '—'}</td>
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
