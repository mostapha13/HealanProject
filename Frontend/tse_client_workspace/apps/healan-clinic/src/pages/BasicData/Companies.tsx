import React, { useEffect, useState } from 'react';

import withAlert from '../../hoc/withAlert';

import healanApi from '../../api/healanApi';

import type { CompanySummary } from '../../api/types';

import { PageHeader } from '../../components/Ui';

import { buildCompanyPayload } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const EMPTY_FORM = {
  companyId: 0,
  companyName: '',
  latinCompanyName: '',
  nationalId: '',
  address: '',
  email: '',
  companyRegistrationTypeId: 2,
  isActive: true,
};

function CompaniesPage({ onAlert }: { onAlert: (msg: unknown) => void }) {

  const [items, setItems] = useState<CompanySummary[]>([]);
  const { page, pageSize, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const { submitting, guard } = useAsyncSubmit();
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [regTypes, setRegTypes] = useState<{ key: number; displayName?: string; name?: string }[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.companies.list({ pageNumber: page, pageSize });
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

    healanApi.companies.registrationTypes().then(setRegTypes).catch(() => {});

  }, []);



  const handleSave = () => {
    void guard(async () => {
      if (!form.companyName.trim() || !form.nationalId.trim()) {
        onAlert({ type: 'error', message: 'نام و شناسه ملی الزامی است' });
        return;
      }
      await healanApi.companies.register(buildCompanyPayload(form));
      setShowForm(false);
      await load();
    }).catch((err) => onAlert(err));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: CompanySummary) => {
    setForm({
      companyId: item.companyId,
      companyName: item.companyName ?? '',
      latinCompanyName: item.latinCompanyName ?? '',
      nationalId: item.nationalId ?? '',
      address: item.address ?? '',
      email: item.email ?? '',
      companyRegistrationTypeId: item.companyRegistrationTypeId ?? 2,
      isActive: item.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (item: CompanySummary) => {
    try {
      await healanApi.companies.register(
        buildCompanyPayload({
          companyId: item.companyId,
          companyName: item.companyName ?? '',
          latinCompanyName: item.latinCompanyName ?? '',
          nationalId: item.nationalId ?? '',
          address: item.address ?? '',
          email: item.email ?? '',
          companyRegistrationTypeId: item.companyRegistrationTypeId ?? 2,
          isActive: !(item.isActive ?? true),
        })
      );
      await load();
    } catch (err) {
      onAlert(err);
    }
  };



  return (

    <>

      <PageHeader title="شرکت / مرکز درمانی" subtitle="اطلاعات پایه مرکز" action={

        <button type="button" className="healan-btn healan-btn--primary" onClick={openCreate}>+ مرکز جدید</button>

      } />

      {showForm && (

        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>

          <div className="healan-card__body">

            <div className="healan-form-grid">

              <div className="healan-form-field"><label>نام</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>

              <div className="healan-form-field"><label>نام لاتین</label><input value={form.latinCompanyName} onChange={(e) => setForm({ ...form, latinCompanyName: e.target.value })} /></div>

              <div className="healan-form-field"><label>شناسه ملی</label><input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></div>

              <div className="healan-form-field"><label>نوع</label>

                <SearchableSelect
                  value={form.companyRegistrationTypeId}
                  onChange={(v) => setForm({ ...form, companyRegistrationTypeId: v ?? 1 })}
                  allowClear={false}
                  placeholder="نوع ثبت"
                  options={regTypes.map((t) => ({
                    value: t.key,
                    label: t.displayName ?? t.name ?? String(t.key),
                  }))}
                />

              </div>

              <div className="healan-form-field"><label>آدرس</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>

              <div className="healan-form-field"><label>ایمیل (اختیاری)</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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

              <thead><tr><th>نام</th><th>شناسه ملی</th><th>آدرس</th><th>وضعیت</th><th>عملیات</th></tr></thead>

              <tbody>{items.map((c) => <tr key={c.companyId}>
                <td>{c.companyName}</td>
                <td>{c.nationalId ?? '—'}</td>
                <td>{c.address ?? '—'}</td>
                <td>{c.isActive ? 'فعال' : 'غیرفعال'}</td>
                <td>
                  <div className="healan-actions">
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => openEdit(c)}>ویرایش</button>
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void handleToggleActive(c)}>
                      {c.isActive ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                </td>
              </tr>)}</tbody>

            </table>
          )}

        </div>

        <ListPagination page={page} pageSize={pageSize} totalCount={totalCount} onChange={onPaginationChange} />

      </div>

    </>

  );

}



export default withAlert(CompaniesPage);
