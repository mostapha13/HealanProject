import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { InsuranceCompany } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildInsurancePayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

const EMPTY_FORM = { insuranceCompanyId: 0, name: '', code: '', insuranceTypeId: 2, phoneNumber: '', isActive: true };

function InsurancePage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<InsuranceCompany[]>([]);

  const [insTypes, setInsTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



  const load = () => healanApi.insurance.listAll().then(setItems).catch(onAlert);



  useEffect(() => {

    load();

    healanApi.insurance.types().then(setInsTypes).catch(() => {});

  }, []);



  const handleSave = async () => {

    if (!form.name.trim()) {

      onAlert({ type: 'error', message: 'نام بیمه الزامی است' });

      return;

    }

    try {

      await healanApi.insurance.register(buildInsurancePayload(form));

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

  const openEdit = (item: InsuranceCompany) => {
    setForm({
      insuranceCompanyId: item.insuranceCompanyId,
      name: item.name ?? '',
      code: item.code ?? '',
      insuranceTypeId: item.insuranceTypeId ?? 2,
      phoneNumber: item.phoneNumber ?? '',
      isActive: item.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item: InsuranceCompany) => {
    try {
      await healanApi.insurance.register(buildInsurancePayload({
        insuranceCompanyId: item.insuranceCompanyId,
        name: item.name ?? '',
        code: item.code ?? '',
        insuranceTypeId: item.insuranceTypeId ?? 2,
        phoneNumber: item.phoneNumber ?? '',
        isActive: !(item.isActive ?? true),
      }));
      await load();
    } catch (err) {
      onAlert(err);
    }
  };



  return (

    <>

      <PageHeader title="بیمه و قراردادها" subtitle="شرکت‌های بیمه" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>+ بیمه جدید</button>

      } />

      {showForm && (

        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>

          <div className="healan-card__body">

            <div className="healan-form-grid">

              <div className="healan-form-field"><label>نام</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

              <div className="healan-form-field"><label>کد (اختیاری)</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>

              <div className="healan-form-field"><label>نوع</label>

                <SearchableSelect
                  value={form.insuranceTypeId}
                  onChange={(v) => setForm({ ...form, insuranceTypeId: v ?? 2 })}
                  allowClear={false}
                  placeholder="نوع بیمه"
                  options={insTypes.map((t) => ({
                    value: t.key,
                    label: t.displayName ?? t.name ?? String(t.key),
                  }))}
                />

              </div>

              <div className="healan-form-field"><label>تلفن (اختیاری)</label><input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
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

            <thead><tr><th>نام</th><th>کد</th><th>وضعیت</th><th>عملیات</th></tr></thead>

            <tbody>{items.map((i) => <tr key={i.insuranceCompanyId}>
              <td>{i.name}</td>
              <td>{i.code ?? '—'}</td>
              <td>{i.isActive ? 'فعال' : 'غیرفعال'}</td>
              <td>
                <div className="healan-actions">
                  <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(i)}>ویرایش</button>
                  <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleToggleActive(i)}>
                    {i.isActive ? 'غیرفعال' : 'فعال'}
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



export default withAlert(InsurancePage);


