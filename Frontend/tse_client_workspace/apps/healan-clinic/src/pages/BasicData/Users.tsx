import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { UserSummary } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildUserPayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

const USER_TYPE_OPTIONS = [
  { value: 2, label: 'مدیر' },
  { value: 3, label: 'منشی' },
  { value: 7, label: 'پزشک' },
  { value: 8, label: 'حسابدار' },
];

const EMPTY_FORM = {
  userId: 0,
  firstName: '',
  lastName: '',
  phoneNumber: '',
  userTypeId: 3,
  isActive: true,
};

function UsersPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<UserSummary[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



  const load = () => healanApi.users.listAll().then(setItems).catch(onAlert);



  useEffect(() => {

    load();

  }, []);



  const handleSave = async () => {

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber.trim()) {

      onAlert({ type: 'error', message: 'نام، نام خانوادگی و موبایل الزامی است' });

      return;

    }

    try {

      await healanApi.users.register(buildUserPayload(form));

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

  const openEdit = (user: UserSummary) => {
    setForm({
      userId: user.userId,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      userTypeId: user.userTypeId ?? 3,
      isActive: user.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (user: UserSummary) => {
    try {
      await healanApi.users.register(buildUserPayload({
        userId: user.userId,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phoneNumber: user.phoneNumber ?? '',
        userTypeId: user.userTypeId ?? 3,
        isActive: !(user.isActive ?? true),
      }));
      await load();
    } catch (err) {
      onAlert(err);
    }
  };



  return (

    <>

      <PageHeader title="کاربران" subtitle="مدیریت کاربران و نقش‌ها" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>+ کاربر جدید</button>

      } />

      {showForm && (

        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>

          <div className="healan-card__body">

            <div className="healan-form-grid">

              <div className="healan-form-field"><label>نام</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>

              <div className="healan-form-field"><label>نام خانوادگی</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>

              <div className="healan-form-field"><label>موبایل</label><input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>

              <div className="healan-form-field"><label>نوع کاربر</label>

                <SearchableSelect
                  value={form.userTypeId}
                  onChange={(v) => setForm({ ...form, userTypeId: v ?? 2 })}
                  allowClear={false}
                  placeholder="نوع کاربر"
                  options={USER_TYPE_OPTIONS}
                />

              </div>
              <div className="healan-form-field"><label>وضعیت</label>
                <SearchableSelect
                  value={form.isActive ? 1 : 0}
                  onChange={(v) => setForm({ ...form, isActive: (v ?? 1) === 1 })}
                  allowClear={false}
                  placeholder="وضعیت"
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

            <thead><tr><th>نام</th><th>موبایل</th><th>نقش Identity</th><th>وضعیت</th><th>عملیات</th></tr></thead>

            <tbody>{items.map((u) => (

              <tr key={u.userId}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.phoneNumber ?? '—'}</td>
                <td>
                  {u.userRoles && u.userRoles.length > 0
                    ? u.userRoles
                        .filter((r) => r.name && r.name !== 'Healan')
                        .map((r) => r.displayName || r.name)
                        .join('، ') || u.userRoles.map((r) => r.displayName || r.name).join('، ')
                    : u.userTypeName ?? '—'}
                </td>
                <td>{u.isActive ? 'فعال' : 'غیرفعال'}</td>
                <td>
                  <div className="healan-actions">
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(u)}>ویرایش</button>
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleToggleActive(u)}>
                      {u.isActive ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                </td>
              </tr>

            ))}</tbody>

          </table>

        </div>

      </div>

    </>

  );

}



export default withAlert(UsersPage);


