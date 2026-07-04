import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { CompanySummary } from '../../api/types';
import { PageHeader } from '../../components/Ui';

function CompaniesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<CompanySummary[]>([]);
  const [regTypes, setRegTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyId: 0,
    companyName: '',
    latinCompanyName: '',
    nationalId: '',
    address: '',
    email: '',
    companyRegistrationTypeId: 2,
  });

  const load = () =>
    healanApi.companies.list({ pageSize: 50 }).then((r) => setItems(r.items ?? [])).catch(onAlert);

  useEffect(() => {
    load();
    healanApi.companies.registrationTypes().then(setRegTypes).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.companies.register(form);
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="شرکت / مرکز درمانی" subtitle="اطلاعات پایه مرکز" action={
        <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ مرکز جدید</button>
      } />
      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field"><label>نام</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div className="healan-form-field"><label>نام لاتین</label><input value={form.latinCompanyName} onChange={(e) => setForm({ ...form, latinCompanyName: e.target.value })} /></div>
              <div className="healan-form-field"><label>شناسه ملی</label><input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></div>
              <div className="healan-form-field"><label>نوع</label>
                <select value={form.companyRegistrationTypeId} onChange={(e) => setForm({ ...form, companyRegistrationTypeId: +e.target.value })}>
                  {regTypes.map((t) => <option key={t.key} value={t.key}>{t.displayName ?? t.name}</option>)}
                </select>
              </div>
              <div className="healan-form-field"><label>آدرس</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="healan-form-field"><label>ایمیل</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ذخیره</button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          <table className="healan-table">
            <thead><tr><th>نام</th><th>شناسه ملی</th><th>آدرس</th></tr></thead>
            <tbody>{items.map((c) => <tr key={c.companyId}><td>{c.companyName}</td><td>{c.nationalId ?? '—'}</td><td>{c.address ?? '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default withAlert(CompaniesPage);
