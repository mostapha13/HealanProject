import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type {
  AppointmentSummary,
  DoctorSummary,
  InsuranceCompany,
  PatientSummary,
  ServiceType,
} from '../../api/types';
import { PageHeader, formatCurrency } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate } from '@tse/utils';

function AppointmentsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    appointmentId: 0,
    patientId: 0,
    doctorId: 0,
    durationMinutes: 30,
    note: '',
    primaryInsuranceCompanyId: null as number | null,
    confirmPrimaryInsuranceCompany: false,
    secondInsuranceCompanyId: null as number | null,
    confirmSecondInsuranceCompany: false,
    serviceTypeIds: [] as number[],
    appointmentDate: new Date().toISOString().slice(0, 16),
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.appointments.list({ filterText: filter, pageNumber: 1, pageSize: 50 });
      setAppointments(res.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    Promise.all([
      healanApi.patients.list({ pageNumber: 1, pageSize: 200 }),
      healanApi.doctors.list({ pageNumber: 1, pageSize: 200 }),
      healanApi.services.list(),
      healanApi.insurance.list(),
    ]).then(([p, d, s, i]) => {
      setPatients(p.items ?? []);
      setDoctors(d.items ?? []);
      setServices(s.items ?? []);
      setInsurances(i.items ?? []);
    }).catch(() => {});
  }, []);

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  const handleSave = async () => {
    try {
      await healanApi.appointments.register({
        ...form,
        appointmentDate: new Date(form.appointmentDate).toISOString(),
      });
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const handlePay = async (appointmentId: number) => {
    try {
      const invoice = await healanApi.appointments.invoice(appointmentId) as { invoiceId: number };
      await healanApi.appointments.pay({
        invoiceId: invoice.invoiceId,
        paymentReference: `PAY-${Date.now()}`,
        paymentMethodTypeId: 'Cash',
      });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="پذیرش و نوبت‌دهی"
        subtitle="ثبت نوبت، محاسبه هزینه و پرداخت"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ پذیرش جدید</button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header"><h3>فرم پذیرش بیمار</h3></div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>بیمار</label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: +e.target.value })}>
                  <option value={0}>انتخاب بیمار</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>{p.firstName} {p.lastName} — {p.nationalCode}</option>
                  ))}
                </select>
              </div>
              <div className="healan-form-field">
                <label>پزشک</label>
                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: +e.target.value })}>
                  <option value={0}>انتخاب پزشک</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="healan-form-field">
                <label>تاریخ و ساعت</label>
                <input type="datetime-local" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>مدت (دقیقه)</label>
                <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>بیمه پایه</label>
                <select value={form.primaryInsuranceCompanyId ?? ''} onChange={(e) => setForm({ ...form, primaryInsuranceCompanyId: e.target.value ? +e.target.value : null })}>
                  <option value="">بدون بیمه</option>
                  {insurances.map((ins) => (
                    <option key={ins.insuranceCompanyId} value={ins.insuranceCompanyId}>{ins.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>خدمات</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {services.map((s) => (
                  <label key={s.serviceTypeId} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={form.serviceTypeIds.includes(s.serviceTypeId)} onChange={() => toggleService(s.serviceTypeId)} />
                    {s.title}
                  </label>
                ))}
              </div>
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>یادداشت</label>
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ثبت نوبت</button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-search-bar">
        <input placeholder="جستجو..." value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button type="button" className="healan-btn healan-btn--primary" onClick={load}>جستجو</button>
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>بیمار</th>
                  <th>پزشک</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>مبلغ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const inv = a.invoices?.[0];
                  const isPaid = inv?.invoiceStatusTypeId === 'Paid' || inv?.invoiceStatusTypeId === 'Paied';
                  return (
                    <tr key={a.appointmentId}>
                      <td>{a.patientName ?? '—'}</td>
                      <td>{a.doctorName ?? '—'}</td>
                      <td>{convertDateAndTimeToJalali(a.appointmentDate)}</td>
                      <td>{a.appointmentTypeName ?? a.appointmentTypeId}</td>
                      <td>{inv ? formatCurrency(inv.patientPayable) : '—'}</td>
                      <td>
                        <div className="healan-actions">
                          {!isPaid && inv && (
                            <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => handlePay(a.appointmentId)}>پرداخت</button>
                          )}
                          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>جزئیات</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(AppointmentsPage);
