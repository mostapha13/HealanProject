import React, { useEffect, useState } from 'react';
import healanApi from '../../api/healanApi';
import type { BookingDepartmentItem, EnumItem, ServiceType } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import withAlert from '../../hoc/withAlert';

const emptyForm = {
  title: '',
  medicalGroupTypeId: 0,
  serviceTypeIds: [] as number[],
  sortOrder: 0,
  supportsComplementaryInsurance: false,
  isActive: true,
};

function BookingDepartmentsPage({ onAlert }: { onAlert: (message: unknown) => void }) {
  const [departments, setDepartments] = useState<BookingDepartmentItem[]>([]);
  const [groups, setGroups] = useState<EnumItem[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [editingId, setEditingId] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [serviceToAdd, setServiceToAdd] = useState(0);
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => setDepartments((await healanApi.booking.departmentList()) ?? []);

  useEffect(() => {
    Promise.all([
      healanApi.booking.departmentList(),
      healanApi.doctors.medicalGroups(),
      healanApi.services.listActive(),
    ])
      .then(([departmentList, medicalGroups, activeServices]) => {
        setDepartments(departmentList ?? []);
        setGroups(medicalGroups ?? []);
        setServices(activeServices ?? []);
      })
      .catch(onAlert);
  }, [onAlert]);

  const reset = () => {
    setEditingId(0);
    setForm(emptyForm);
    setServiceToAdd(0);
  };

  const addService = () => {
    if (!serviceToAdd || form.serviceTypeIds.includes(serviceToAdd)) return;
    setForm({ ...form, serviceTypeIds: [...form.serviceTypeIds, serviceToAdd] });
    setServiceToAdd(0);
  };

  const removeService = (serviceTypeId: number) => {
    setForm({ ...form, serviceTypeIds: form.serviceTypeIds.filter((id) => id !== serviceTypeId) });
  };

  const save = async () => {
    if (!form.title.trim() || !form.medicalGroupTypeId || form.serviceTypeIds.length === 0) {
      onAlert({ type: 'error', message: 'عنوان، تخصص مادر و حداقل یک خدمت را انتخاب کنید.' });
      return;
    }
    setSaving(true);
    try {
      await healanApi.booking.departmentSave({
        bookingDepartmentId: editingId,
        ...form,
        title: form.title.trim(),
      });
      await loadDepartments();
      reset();
      onAlert({ type: 'success', message: 'دپارتمان با موفقیت ذخیره شد.' });
    } catch (error) {
      onAlert(error);
    } finally {
      setSaving(false);
    }
  };

  const edit = (department: BookingDepartmentItem) => {
    setEditingId(department.bookingDepartmentId);
    setServiceToAdd(0);
    setForm({
      title: department.title,
      medicalGroupTypeId: department.medicalGroupTypeId,
      serviceTypeIds: department.serviceTypeIds ?? [],
      sortOrder: department.sortOrder ?? 0,
      supportsComplementaryInsurance: department.supportsComplementaryInsurance,
      isActive: department.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    try {
      await healanApi.booking.departmentDelete(id);
      await loadDepartments();
      if (editingId === id) reset();
      onAlert({ type: 'success', message: 'دپارتمان حذف شد.' });
    } catch (error) {
      onAlert(error);
    }
  };

  return (
    <>
      <PageHeader
        title="تعریف دپارتمان‌های نوبت‌دهی"
        subtitle="برای هر تخصص، دپارتمان‌ها، خدمات زیرمجموعه و امکان پذیرش بیمه تکمیلی را تعریف کنید."
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>{editingId ? 'ویرایش دپارتمان' : 'دپارتمان جدید'}</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>عنوان دپارتمان</label>
              <input className="healan-input" value={form.title} placeholder="مثلاً واریس یا قلب" onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="healan-form-field">
              <label>گروه پزشک (تخصص مادر)</label>
              <select className="healan-input" value={form.medicalGroupTypeId} onChange={(event) => setForm({ ...form, medicalGroupTypeId: Number(event.target.value) })}>
                <option value={0}>انتخاب تخصص</option>
                {groups.map((group) => <option key={group.key} value={group.key}>{group.displayName || group.name}</option>)}
              </select>
            </div>
            <div className="healan-form-field">
              <label>ترتیب نمایش</label>
              <input className="healan-input" type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Math.max(0, Number(event.target.value) || 0) })} />
            </div>
            <div className="healan-form-field">
              <label>پذیرش بیمه تکمیلی</label>
              <select className="healan-input" value={form.supportsComplementaryInsurance ? '1' : '0'} onChange={(event) => setForm({ ...form, supportsComplementaryInsurance: event.target.value === '1' })}>
                <option value="0">خیر؛ فقط آزاد</option>
                <option value="1">بله</option>
              </select>
            </div>
            <div className="healan-form-field">
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                دپارتمان فعال باشد
              </label>
            </div>
            <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>خدمات زیرمجموعه</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
                <select className="healan-input" style={{ flex: '1 1 280px' }} value={serviceToAdd} onChange={(event) => setServiceToAdd(Number(event.target.value))}>
                  <option value={0}>انتخاب خدمت برای افزودن</option>
                  {services.filter((service) => !form.serviceTypeIds.includes(service.serviceTypeId)).map((service) => <option key={service.serviceTypeId} value={service.serviceTypeId}>{service.title}</option>)}
                </select>
                <button type="button" className="healan-btn healan-btn--outline" disabled={!serviceToAdd} onClick={addService}>افزودن خدمت</button>
              </div>
              {form.serviceTypeIds.length === 0 ? (
                <div className="healan-empty" style={{ marginTop: 10 }}>هنوز خدمتی به این دپارتمان اضافه نشده است.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {form.serviceTypeIds.map((serviceTypeId) => {
                    const service = services.find((item) => item.serviceTypeId === serviceTypeId);
                    return (
                      <div key={serviceTypeId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: '1px solid var(--healan-border, #e5e7eb)', borderRadius: 10 }}>
                        <span>{service?.title || `خدمت ${serviceTypeId}`}</span>
                        <button type="button" className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm" onClick={() => removeService(serviceTypeId)}>حذف از دپارتمان</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <small className="healan-muted">مثلاً برای دپارتمان واریس، «سونوگرافی داپلر عروق» را انتخاب و اضافه کنید. تعریف عنوان خدمت جدید از منوی «اطلاعات پایه ← انواع خدمات» انجام می‌شود.</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
            <button type="button" className="healan-btn healan-btn--primary" disabled={saving} onClick={() => void save()}>{saving ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'ثبت دپارتمان'}</button>
            {editingId > 0 && <button type="button" className="healan-btn healan-btn--muted" onClick={reset}>انصراف</button>}
          </div>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__header"><h3>دپارتمان‌های تعریف‌شده</h3></div>
        <div className="healan-card__body">
          {departments.length === 0 ? <div className="healan-empty">هنوز دپارتمانی تعریف نشده است.</div> : (
            <table className="healan-table">
              <thead><tr><th>عنوان</th><th>تخصص مادر</th><th>خدمات</th><th>بیمه تکمیلی</th><th>وضعیت</th><th>عملیات</th></tr></thead>
              <tbody>{departments.map((department) => (
                <tr key={department.bookingDepartmentId}>
                  <td>{department.title}</td>
                  <td>{groups.find((group) => Number(group.key) === department.medicalGroupTypeId)?.displayName || groups.find((group) => Number(group.key) === department.medicalGroupTypeId)?.name || '—'}</td>
                  <td>{department.serviceTitles?.join('، ') || '—'}</td>
                  <td>{department.supportsComplementaryInsurance ? 'قابل پذیرش' : 'فقط آزاد'}</td>
                  <td>{department.isActive ? 'فعال' : 'غیرفعال'}</td>
                  <td><div style={{ display: 'flex', gap: 8 }}><button type="button" className="healan-btn healan-btn--action healan-btn--edit healan-btn--sm" onClick={() => edit(department)}>ویرایش</button><button type="button" className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm" onClick={() => void remove(department.bookingDepartmentId)}>حذف</button></div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(BookingDepartmentsPage);
