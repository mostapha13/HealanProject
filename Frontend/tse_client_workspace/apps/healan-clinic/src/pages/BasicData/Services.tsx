import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { ServiceType } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildServicePayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

function ServicesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<ServiceType[]>([]);

  const [categories, setCategories] = useState<{ key: number; displayName?: string; name?: string }[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ serviceTypeId: 0, title: '', code: '', categoryTypeId: 1, description: '' });



  const load = () => healanApi.services.listAll().then(setItems).catch(onAlert);



  useEffect(() => {

    load();

    healanApi.services.categories().then(setCategories).catch(() => {});

  }, []);



  const handleSave = async () => {

    if (!form.title.trim()) {

      onAlert({ type: 'error', message: 'عنوان خدمت الزامی است' });

      return;

    }

    try {

      await healanApi.services.register(buildServicePayload(form));

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

              <div className="healan-form-field"><label>کد (اختیاری)</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>

              <div className="healan-form-field"><label>دسته</label>

                <SearchableSelect
                  value={form.categoryTypeId}
                  onChange={(v) => setForm({ ...form, categoryTypeId: v ?? 1 })}
                  allowClear={false}
                  placeholder="دسته‌بندی"
                  options={categories.map((c) => ({
                    value: c.key,
                    label: c.displayName ?? c.name ?? String(c.key),
                  }))}
                />

              </div>

              <div className="healan-form-field"><label>توضیحات (اختیاری)</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

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


