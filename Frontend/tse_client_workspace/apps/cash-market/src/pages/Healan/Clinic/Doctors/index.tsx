import React, { useEffect, useState } from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import healanApi from 'apps/cash-market/src/Controller/Healan/api';
import type { DoctorSummary } from 'apps/cash-market/src/Controller/Healan/types';
import { PageHeader } from '../components/Ui';

function DoctorsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [medicalGroups, setMedicalGroups] = useState<{ key: number; name: string; displayName?: string }[]>([]);
  const [form, setForm] = useState({
    doctorId: 0,
    firstName: '',
    lastName: '',
    nationalCode: '',
    mobile: '',
    medicalGroupTypeId: 0,
    companyId: 1,
    medicalSystemNumber: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.doctors.list({ filterText: filter, pageNumber: 1, pageSize: 50 });
      setDoctors(res.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    healanApi.doctors.medicalGroups().then(setMedicalGroups).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.doctors.register(form);
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="مدیریت پزشکان"
        subtitle="ثبت و مدیریت پزشکان کلینیک"
        action={
          <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ پزشک جدید</button>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header"><h3>ثبت پزشک</h3></div>
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
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>شماره نظام پزشکی</label>
                <input type="number" value={form.medicalSystemNumber} onChange={(e) => setForm({ ...form, medicalSystemNumber: +e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>گروه پزشکی</label>
                <select value={form.medicalGroupTypeId} onChange={(e) => setForm({ ...form, medicalGroupTypeId: +e.target.value })}>
                  <option value={0}>انتخاب کنید</option>
                  {medicalGroups.map((g) => (
                    <option key={g.key} value={g.key}>{g.displayName ?? g.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ذخیره</button>
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
                  <th>نام</th>
                  <th>کد ملی</th>
                  <th>موبایل</th>
                  <th>تخصص</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctorId}>
                    <td>{d.firstName} {d.lastName}</td>
                    <td>{d.nationalCode}</td>
                    <td>{d.mobile}</td>
                    <td>{d.medicalGroupTypeName ?? '—'}</td>
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

export default withAlert(DoctorsPage);
