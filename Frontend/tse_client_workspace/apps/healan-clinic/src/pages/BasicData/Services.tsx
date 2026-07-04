import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { ServiceType } from '../../api/types';
import { PageHeader } from '../../components/Ui';

function ServicesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<{ key: number; displayName?: string; name?: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceTypeId: 0, title: '', code: '', categoryTypeId: 1, description: '' });

  const load = () => healanApi.services.list().then((r) => setItems(r.items ?? [])).catch(onAlert);

  useEffect(() => {
    load();
    healanApi.services.categories().then(setCategories).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.services.register(form);
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="انواع خدمات" action={
        <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ خدمت جدید</button>
      } />
      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field"><label>عنوان</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="healan-form-field"><label>کد</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="healan-form-field"><label>دسته</label>
                <select value={form.categoryTypeId} onChange={(e) => setForm({ ...form, categoryTypeId: +e.target.value })}>
                  {categories.map((c) => <option key={c.key} value={c.key}>{c.displayName ?? c.name}</option>)}
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
            <thead><tr><th>عنوان</th><th>کد</th></tr></thead>
            <tbody>{items.map((s) => <tr key={s.serviceTypeId}><td>{s.title}</td><td>{s.code ?? '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default withAlert(ServicesPage);
