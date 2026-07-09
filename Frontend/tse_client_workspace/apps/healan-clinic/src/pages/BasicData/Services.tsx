import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { ServiceType } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildServicePayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

const EMPTY_FORM = { serviceTypeId: 0, title: '', code: '', categoryTypeId: 1, description: '', isActive: true };

function ServicesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<ServiceType[]>([]);

  const [categories, setCategories] = useState<{ key: number; displayName?: string; name?: string }[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



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

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: ServiceType) => {
    setForm({
      serviceTypeId: item.serviceTypeId,
      title: item.title ?? '',
      code: item.code ?? '',
      categoryTypeId: item.categoryTypeId ?? 1,
      description: item.description ?? '',
      isActive: item.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item: ServiceType) => {
    try {
      await healanApi.services.register(buildServicePayload({
        serviceTypeId: item.serviceTypeId,
        title: item.title ?? '',
        code: item.code ?? '',
        categoryTypeId: item.categoryTypeId ?? 1,
        description: item.description ?? '',
        isActive: !(item.isActive ?? true),
      }));
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const handleDelete = async (item: ServiceType) => {
    if (!window.confirm(`خدمت «${item.title}» حذف شود؟`)) return;
    try {
      await healanApi.services.delete(item.serviceTypeId);
      onAlert({ type: 'success', message: 'خدمت با موفقیت حذف شد' });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };



  return (

    <>

      <PageHeader title="انواع خدمات" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>+ خدمت جدید</button>

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
              <div className="healan-form-field"><label>وضعیت</label>
                <SearchableSelect
                  value={form.isActive ? 1 : 0}
                  onChange={(v) => setForm({ ...form, isActive: (v ?? 1) === 1 })}
                  allowClear={false}
                  options={[
                    { value: 1, label: 'فعال' },
                    { value: 0, label: 'غیرفعال' },
                  ]}
                />
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

            <thead><tr><th>عنوان</th><th>کد</th><th>وضعیت</th><th>عملیات</th></tr></thead>

            <tbody>{items.map((s) => <tr key={s.serviceTypeId}>
              <td>{s.title}</td>
              <td>{s.code ?? '—'}</td>
              <td>{s.isActive ? 'فعال' : 'غیرفعال'}</td>
              <td>
                <div className="healan-actions">
                  <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(s)}>ویرایش</button>
                  <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleToggleActive(s)}>
                    {s.isActive ? 'غیرفعال' : 'فعال'}
                  </button>
                  <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleDelete(s)}>
                    حذف
                  </button>
                </div>
              </td>
            </tr>)}</tbody>

          </table>

        </div>

      </div>

    </>

  );

}



export default withAlert(ServicesPage);


