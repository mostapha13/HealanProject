import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { InsuranceCompany } from '../../api/types';
import { PageHeader } from '../../components/Ui';

function InsurancePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<InsuranceCompany[]>([]);
  const [insTypes, setInsTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ insuranceCompanyId: 0, name: '', code: '', insuranceTypeId: 2, phoneNumber: '' });

  const load = () => healanApi.insurance.list({ pageSize: 50 }).then((r) => setItems(r.items ?? [])).catch(onAlert);

  useEffect(() => {
    load();
    healanApi.insurance.types().then(setInsTypes).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.insurance.register(form);
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="بیمه و قراردادها" subtitle="شرکت‌های بیمه" action={
        <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ بیمه جدید</button>
      } />
      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field"><label>نام</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="healan-form-field"><label>کد</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="healan-form-field"><label>نوع</label>
                <select value={form.insuranceTypeId} onChange={(e) => setForm({ ...form, insuranceTypeId: +e.target.value })}>
                  {insTypes.map((t) => <option key={t.key} value={t.key}>{t.displayName ?? t.name}</option>)}
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
      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          <table className="healan-table">
            <thead><tr><th>نام</th><th>کد</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.insuranceCompanyId}><td>{i.name}</td><td>{i.code ?? '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default withAlert(InsurancePage);
