import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { MedicalFeeService, ServiceType } from '../../api/types';

import { PageHeader, formatCurrency } from '../../components/Ui';

import { convertDateToJalali } from '@tse/tools';

import { buildMedicalFeePayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { JalaliDateInput } from '../../components/JalaliDateInput';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const EMPTY_FORM = {
  medicalFeeServiceId: 0,
  serviceTypeId: 0,
  price: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: `${new Date().getFullYear()}-12-31`,
  isActive: true,
};

function MedicalFeesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<MedicalFeeService[]>([]);
  const { page, pageSize, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const { submitting, guard } = useAsyncSubmit();
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<ServiceType[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.medicalFees.list({ pageNumber: page, pageSize });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    void load();
  }, [page, pageSize]);

  useEffect(() => {
    healanApi.services.listActive().then(setServices).catch(() => {});
  }, []);



  const handleSave = () => {
    void guard(async () => {
      if (form.serviceTypeId <= 0) {
        onAlert({ type: 'error', message: 'خدمت را انتخاب کنید' });
        return;
      }
      if (form.price <= 0) {
        onAlert({ type: 'error', message: 'قیمت باید بیشتر از صفر باشد' });
        return;
      }
      await healanApi.medicalFees.register(buildMedicalFeePayload(form));
      setShowForm(false);
      await load();
    }).catch((err) => onAlert(err));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: MedicalFeeService) => {
    setForm({
      medicalFeeServiceId: item.medicalFeeServiceId,
      serviceTypeId: item.serviceTypeId,
      price: item.price,
      startDate: item.startDate ? item.startDate.slice(0, 10) : EMPTY_FORM.startDate,
      endDate: item.endDate ? item.endDate.slice(0, 10) : EMPTY_FORM.endDate,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item: MedicalFeeService) => {
    try {
      await healanApi.medicalFees.register(buildMedicalFeePayload({
        medicalFeeServiceId: item.medicalFeeServiceId,
        serviceTypeId: item.serviceTypeId,
        price: item.price,
        startDate: item.startDate ? item.startDate.slice(0, 10) : EMPTY_FORM.startDate,
        endDate: item.endDate ? item.endDate.slice(0, 10) : EMPTY_FORM.endDate,
        isActive: !item.isActive,
      }));
      await load();
    } catch (err) {
      onAlert(err);
    }
  };



  return (

    <>

      <PageHeader title="تعرفه خدمات" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>+ تعرفه جدید</button>

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

              <div className="healan-form-field"><label>از تاریخ</label>
                <JalaliDateInput
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                />
              </div>

              <div className="healan-form-field"><label>تا تاریخ</label>
                <JalaliDateInput
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
                />
              </div>
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

              <button type="button" className="healan-btn healan-btn--primary" disabled={submitting} onClick={handleSave}>
                {submitting ? 'در حال ذخیره...' : 'ذخیره'}
              </button>

              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>

            </div>

          </div>

        </div>

      )}

      <div className="healan-card">

        <div className="healan-card__body" style={{ padding: 0 }}>

          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : (
          <table className="healan-table">

            <thead><tr><th>خدمت</th><th>قیمت</th><th>از</th><th>تا</th><th>وضعیت</th><th>عملیات</th></tr></thead>

            <tbody>{items.map((m) => (

              <tr key={m.medicalFeeServiceId}>

                <td>{m.serviceTypeTitle || m.serviceTypeName || services.find((s) => s.serviceTypeId === m.serviceTypeId)?.title || '—'}</td>

                <td>{formatCurrency(m.price)}</td>

                <td><span>{convertDateToJalali(m.startDate)}</span></td>

                <td><span>{convertDateToJalali(m.endDate)}</span></td>

                <td>{m.isActive ? 'فعال' : 'غیرفعال'}</td>
                <td>
                  <div className="healan-actions">
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(m)}>ویرایش</button>
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleToggleActive(m)}>
                      {m.isActive ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                </td>

              </tr>

            ))}</tbody>

          </table>
          )}

        </div>

        <ListPagination page={page} pageSize={pageSize} totalCount={totalCount} onChange={onPaginationChange} />

      </div>

    </>

  );

}



export default withAlert(MedicalFeesPage);


