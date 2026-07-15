import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { DoctorSummary } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildDoctorPayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';

function DoctorsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);

  const [filter, setFilter] = useState('');

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [defaultCompanyId, setDefaultCompanyId] = useState(0);

  const [medicalGroups, setMedicalGroups] = useState<{ key: number; name: string; displayName?: string }[]>([]);

  const [form, setForm] = useState({

    doctorId: 0,

    firstName: '',

    lastName: '',

    nationalCode: '',

    mobile: '',

    medicalGroupTypeId: 0,

    companyId: 0,

    medicalSystemNumber: 0,

  });



  const load = async () => {

    setLoading(true);

    try {

      const res = await healanApi.doctors.listAll({ filterText: filter });

      setDoctors(res);

    } catch (err) {

      onAlert(err);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    load();

    healanApi.doctors.medicalGroups().then(setMedicalGroups).catch(() => {});

    healanApi.companies.listAll().then((list) => {
      if (list[0]) {
        setDefaultCompanyId(list[0].companyId);
        setForm((f) => ({ ...f, companyId: list[0].companyId }));
      }
    }).catch(() => {});

  }, []);



  const resetForm = () => {

    setForm({

      doctorId: 0,

      firstName: '',

      lastName: '',

      nationalCode: '',

      mobile: '',

      medicalGroupTypeId: 0,

      companyId: defaultCompanyId,

      medicalSystemNumber: 0,

    });

    setShowForm(false);

  };



  const handleSave = async () => {

    if (!form.firstName.trim() || !form.lastName.trim() || !form.nationalCode.trim() || !form.mobile.trim()) {

      onAlert({ type: 'error', message: 'نام، نام خانوادگی، کد ملی و موبایل الزامی است' });

      return;

    }

    if (form.medicalGroupTypeId <= 0) {

      onAlert({ type: 'error', message: 'گروه پزشکی را انتخاب کنید' });

      return;

    }

    if (form.companyId <= 0) {

      onAlert({ type: 'error', message: 'مرکز پیش‌فرض یافت نشد. با پشتیبانی تماس بگیرید.' });

      return;

    }

    try {

      await healanApi.doctors.register(buildDoctorPayload(form));

      resetForm();

      await load();

    } catch (err) {

      onAlert(err);

    }

  };



  const editDoctor = (d: DoctorSummary) => {

    setForm({

      doctorId: d.doctorId,

      firstName: d.firstName,

      lastName: d.lastName,

      nationalCode: d.nationalCode,

      mobile: d.mobile,

      medicalGroupTypeId: d.medicalGroupTypeId ?? 0,

      companyId: d.companyId ?? defaultCompanyId,

      medicalSystemNumber: d.medicalSystemNumber ?? 0,

    });

    setShowForm(true);

  };



  return (

    <>

      <PageHeader

        title="مدیریت پزشکان"

        subtitle="ثبت و مدیریت پزشکان کلینیک"

        action={

          <button type="button" className="healan-btn healan-btn--primary" onClick={() => { resetForm(); setShowForm(true); }}>+ پزشک جدید</button>

        }

      />



      {showForm && (

        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>

          <div className="healan-card__header"><h3>{form.doctorId ? 'ویرایش پزشک' : 'ثبت پزشک'}</h3></div>

          <div className="healan-card__body">

            <div className="healan-form-grid">

              <div className="healan-form-field">

                <label>نام</label>

                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />

              </div>

              <div className="healan-form-field">

                <label>نام خانوادگی</label>

                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />

              </div>

              <div className="healan-form-field">

                <label>کد ملی</label>

                <input value={form.nationalCode} maxLength={10} onChange={(e) => setForm({ ...form, nationalCode: e.target.value })} />

              </div>

              <div className="healan-form-field">

                <label>موبایل</label>

                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />

              </div>

              <div className="healan-form-field">

                <label>شماره نظام پزشکی</label>

                <input type="number" value={form.medicalSystemNumber} onChange={(e) => setForm({ ...form, medicalSystemNumber: +e.target.value })} />

              </div>

              <div className="healan-form-field">

                <label>گروه پزشکی</label>

                <SearchableSelect
                  value={form.medicalGroupTypeId}
                  onChange={(v) => setForm({ ...form, medicalGroupTypeId: v ?? 0 })}
                  placeholder="انتخاب کنید"
                  options={medicalGroups.map((g) => ({
                    value: g.key,
                    label: g.displayName ?? g.name ?? String(g.key),
                  }))}
                />

              </div>

            </div>

            <div className="healan-actions" style={{ marginTop: '1rem' }}>

              <button type="button" className="healan-btn healan-btn--primary" onClick={handleSave}>ذخیره</button>

              <button type="button" className="healan-btn healan-btn--outline" onClick={resetForm}>انصراف</button>

            </div>

          </div>

        </div>

      )}



      <div className="healan-search-bar">

        <input placeholder="جستجو..." value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />

        <button type="button" className="healan-btn healan-btn--primary" onClick={load}>جستجو</button>

      </div>



      <div className="healan-card">

        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>

          {loading ? (

            <div className="healan-empty">در حال بارگذاری...</div>

          ) : (

            <table className="healan-table">

              <thead>

                <tr>

                  <th>نام</th>

                  <th>کد ملی</th>

                  <th>موبایل</th>

                  <th>تخصص</th>

                  <th>عملیات</th>

                </tr>

              </thead>

              <tbody>

                {doctors.map((d) => (

                  <tr key={d.doctorId}>

                    <td>{d.firstName} {d.lastName}</td>

                    <td>{d.nationalCode}</td>

                    <td>{d.mobile}</td>

                    <td>{d.medicalGroupTypeName ?? '—'}</td>

                    <td>

                      <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => editDoctor(d)}>ویرایش</button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </>

  );

}



export default withAlert(DoctorsPage);


