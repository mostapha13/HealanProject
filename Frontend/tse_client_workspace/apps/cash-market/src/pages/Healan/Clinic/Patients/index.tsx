import React, { useEffect, useState } from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import healanApi from 'apps/cash-market/src/Controller/Healan/api';
import type { PatientSummary } from 'apps/cash-market/src/Controller/Healan/types';
import { PageHeader } from '../components/Ui';
import { convertDateToJalali } from '@tse/tools';

function PatientsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    patientId: 0,
    firstName: '',
    lastName: '',
    nationalCode: '',
    phoneNumber: '',
    birthdate: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.patients.list({ filterText: filter, pageNumber: 1, pageSize: 50 });
      setPatients(res.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ patientId: 0, firstName: '', lastName: '', nationalCode: '', phoneNumber: '', birthdate: '' });
    setShowForm(false);
  };

  const handleSave = async () => {
    try {
      await healanApi.patients.register(form);
      resetForm();
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const editPatient = (p: PatientSummary) => {
    setForm({
      patientId: p.patientId,
      firstName: p.firstName,
      lastName: p.lastName,
      nationalCode: p.nationalCode,
      phoneNumber: p.phoneNumber,
      birthdate: p.birthdate ?? '',
    });
    setShowForm(true);
  };

  return (
    <>
      <PageHeader
        title="مدیریت بیماران"
        subtitle="ثبت، ویرایش و جستجوی پرونده بیماران"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => { resetForm(); setShowForm(true); }}>
            + بیمار جدید
          </button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header"><h3>{form.patientId ? 'ویرایش بیمار' : 'ثبت بیمار جدید'}</h3></div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>نام</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>نام خانوادگی</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>کد ملی</label>
                <input value={form.nationalCode} maxLength={10} onChange={(e) => setForm({ ...form, nationalCode: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>موبایل</label>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ذخیره</button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={resetForm}>انصراف</button>
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
                  <th>نام</th>
                  <th>کد ملی</th>
                  <th>موبایل</th>
                  <th>تاریخ تولد</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.patientId}>
                    <td>{p.firstName} {p.lastName}</td>
                    <td>{p.nationalCode}</td>
                    <td>{p.phoneNumber}</td>
                    <td>{p.birthdate ? convertDateToJalali(p.birthdate) : '—'}</td>
                    <td>
                      <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => editPatient(p)}>ویرایش</button>
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

export default withAlert(PatientsPage);
