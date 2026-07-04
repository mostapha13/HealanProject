import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { MedicalFeeService, ServiceType } from '../../api/types';
import { PageHeader, formatCurrency } from '../../components/Ui';
import { convertDateToJalali } from '@tse/tools';

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

  const load = () => healanApi.medicalFees.list().then((r) => setItems(r.items ?? [])).catch(onAlert);

  useEffect(() => {
    load();
    healanApi.services.list().then((r) => setServices(r.items ?? [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.medicalFees.register({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
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
                <select value={form.serviceTypeId} onChange={(e) => setForm({ ...form, serviceTypeId: +e.target.value })}>
                  <option value={0}>انتخاب</option>
                  {services.map((s) => <option key={s.serviceTypeId} value={s.serviceTypeId}>{s.title}</option>)}
                </select>
              </div>
              <div className="healan-form-field"><label>قیمت (ریال)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
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
                <td>{convertDateToJalali(m.startDate)}</td>
                <td>{convertDateToJalali(m.endDate)}</td>
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
