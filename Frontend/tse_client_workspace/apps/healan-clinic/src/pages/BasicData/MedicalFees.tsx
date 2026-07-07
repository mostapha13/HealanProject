import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { MedicalFeeService, ServiceType } from '../../api/types';

import { PageHeader, formatCurrency } from '../../components/Ui';

import { convertDateToJalali } from '@tse/tools';

import { buildMedicalFeePayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

function MedicalFeesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<MedicalFeeService[]>([]);

  const [services, setServices] = useState<ServiceType[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({

    medicalFeeServiceId: 0,

    serviceTypeId: 0,

    price: 0,

    startDate: new Date().toISOString().slice(0, 10),

    endDate: `${new Date().getFullYear()}-12-31`,

    isActive: true,

  });



  const load = () => healanApi.medicalFees.listAll().then(setItems).catch(onAlert);



  useEffect(() => {

    load();

    healanApi.services.listAll().then(setServices).catch(() => {});

  }, []);



  const handleSave = async () => {

    if (form.serviceTypeId <= 0) {

      onAlert({ type: 'error', message: 'خدمت را انتخاب کنید' });

      return;

    }

    if (form.price <= 0) {

      onAlert({ type: 'error', message: 'قیمت باید بیشتر از صفر باشد' });

      return;

    }

    try {

      await healanApi.medicalFees.register(buildMedicalFeePayload(form));

      setShowForm(false);

      await load();

    } catch (err) {

      onAlert(err);

    }

  };



  return (

    <>

      <PageHeader title="تعرفه خدمات" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ تعرفه جدید</button>

      } />

      {showForm && (

        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>

          <div className="healan-card__body">

            <div className="healan-form-grid">

              <div className="healan-form-field"><label>خدمت</label>

                <SearchableSelect
                  value={form.serviceTypeId}
                  onChange={(v) => setForm({ ...form, serviceTypeId: v ?? 0 })}
                  placeholder="انتخاب"
                  options={services.map((s) => ({
                    value: s.serviceTypeId,
                    label: s.title,
                  }))}
                />

              </div>

              <div className="healan-form-field"><label>قیمت (ریال)</label><input type="number" min={1} value={form.price || ''} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>

              <div className="healan-form-field"><label>از تاریخ</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>

              <div className="healan-form-field"><label>تا تاریخ</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>

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

            <thead><tr><th>خدمت</th><th>قیمت</th><th>از</th><th>تا</th><th>فعال</th></tr></thead>

            <tbody>{items.map((m) => (

              <tr key={m.medicalFeeServiceId}>

                <td>{m.serviceTypeTitle ?? m.serviceTypeId}</td>

                <td>{formatCurrency(m.price)}</td>

                <td><span>{convertDateToJalali(m.startDate)}</span></td>

                <td><span>{convertDateToJalali(m.endDate)}</span></td>

                <td>{m.isActive ? 'بله' : 'خیر'}</td>

              </tr>

            ))}</tbody>

          </table>

        </div>

      </div>

    </>

  );

}



export default withAlert(MedicalFeesPage);


