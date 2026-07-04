import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { UserSummary } from '../../api/types';
import { PageHeader } from '../../components/Ui';

function UsersPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<UserSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: 0,
    firstName: '',
    lastName: '',
    phoneNumber: '',
    userTypeId: 3,
    isActive: true,
    userRoles: ['Secretary'],
  });

  const load = () => healanApi.users.list({ pageNumber: 1, pageSize: 50 }).then((r) => setItems(r.items ?? [])).catch(onAlert);

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    try {
      await healanApi.users.register(form);
      setShowForm(false);
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="کاربران" subtitle="مدیریت کاربران و نقش‌ها" action={
        <button type="button" className="healan-btn healan-btn--primary" onClick={() => setShowForm(true)}>+ کاربر جدید</button>
      } />
      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field"><label>نام</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="healan-form-field"><label>نام خانوادگی</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              <div className="healan-form-field"><label>موبایل</label><input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
              <div className="healan-form-field"><label>نوع کاربر</label>
                <select value={form.userTypeId} onChange={(e) => setForm({ ...form, userTypeId: +e.target.value })}>
                  <option value={2}>مدیر</option>
                  <option value={3}>منشی</option>
                  <option value={7}>پزشک</option>
                  <option value={8}>حسابدار</option>
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
            <thead><tr><th>نام</th><th>موبایل</th><th>فعال</th></tr></thead>
            <tbody>{items.map((u) => (
              <tr key={u.userId}><td>{u.firstName} {u.lastName}</td><td>{u.phoneNumber ?? '—'}</td><td>{u.isActive ? 'بله' : 'خیر'}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default withAlert(UsersPage);
