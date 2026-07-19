import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { PatientSummary } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { convertDateToJalali } from '@tse/tools';
import { buildPatientPayload, toDateInputValue } from '../../utils/apiPayload';
import { isValidIranNationalCode } from '../../utils/nationalCode';
import { PatientVisitHistoryDrawer } from '../../components/PatientVisitHistoryDrawer';
import { PatientBloodPressureLookup } from '../../components/PatientBloodPressureLookup';
import { JalaliDateInput } from '../../components/JalaliDateInput';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

function PatientsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const { submitting, guard } = useAsyncSubmit();
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyPatient, setHistoryPatient] = useState<PatientSummary | null>(null);
  const [bpLookupCode, setBpLookupCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: 0,
    userId: 0,
    firstName: '',
    lastName: '',
    nationalCode: '',
    phoneNumber: '',
    birthdate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healanApi.patients.list({
        filterText: filter || undefined,
        pageNumber: page,
        pageSize,
      });
      setPatients(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  }, [filter, page, pageSize, onAlert]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, filter ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filter]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const resetForm = () => {
    setForm({ patientId: 0, userId: 0, firstName: '', lastName: '', nationalCode: '', phoneNumber: '', birthdate: '' });
    setShowForm(false);
  };

  const handleSave = () => {
    void guard(async () => {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.nationalCode.trim() || !form.phoneNumber.trim()) {
        onAlert({ type: 'error', message: 'نام، نام خانوادگی، کد ملی و موبایل الزامی است' });
        return;
      }

      if (!isValidIranNationalCode(form.nationalCode.trim())) {
        onAlert({ type: 'error', message: 'کد ملی نامعتبر است' });
        return;
      }

      const result = await healanApi.patients.register(buildPatientPayload(form));
      if (result?.initialPassword) {
        onAlert({
          type: 'success',
          message: 'بیمار ثبت شد',
          description: `ورود: ${result.loginUserName ?? form.phoneNumber} / رمز: ${result.initialPassword}`,
        });
      } else {
        onAlert({ type: 'success', message: 'بیمار با موفقیت ثبت شد' });
      }
      resetForm();
      await load();
    }).catch((err) => onAlert(err));
  };

  const editPatient = async (p: PatientSummary) => {
    try {
      const info = await healanApi.patients.info(p.patientId);
      setForm({
        patientId: info.patientId,
        userId: info.userId ?? 0,
        firstName: info.firstName,
        lastName: info.lastName,
        nationalCode: info.nationalCode,
        phoneNumber: info.phoneNumber,
        birthdate: toDateInputValue(info.birthdate),
      });
      setShowForm(true);
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="مدیریت بیماران"
        subtitle="ثبت، ویرایش، سوابق ویزیت و فشار خون"
        action={
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + بیمار جدید
          </button>
        }
      />

      <PatientBloodPressureLookup
        key={bpLookupCode ?? 'bp-lookup'}
        onAlert={onAlert}
        initialNationalCode={bpLookupCode ?? ''}
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header">
            <h3>{form.patientId ? 'ویرایش بیمار' : 'ثبت بیمار جدید'}</h3>
          </div>
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
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>تاریخ تولد (شمسی — اختیاری)</label>
                <JalaliDateInput
                  value={form.birthdate}
                  onChange={(birthdate) => setForm({ ...form, birthdate })}
                />
              </div>
            </div>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={submitting} onClick={handleSave}>
                {submitting ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={resetForm}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {historyPatient && (
        <PatientVisitHistoryDrawer
          patientId={historyPatient.patientId}
          patientName={`${historyPatient.firstName} ${historyPatient.lastName}`}
          onAlert={onAlert}
          onClose={() => setHistoryPatient(null)}
        />
      )}

      <div className="healan-search-bar">
        <input placeholder="جستجو..." value={filter} onChange={(e) => setFilter(e.target.value)} />
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
                  <th>تاریخ تولد</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.patientId}>
                    <td>
                      {p.firstName} {p.lastName}
                    </td>
                    <td>{p.nationalCode}</td>
                    <td>{p.phoneNumber}</td>
                    <td>{p.birthdate ? <span>{convertDateToJalali(p.birthdate)}</span> : '—'}</td>
                    <td>
                      <div className="healan-actions">
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => editPatient(p)}>
                          ویرایش
                        </button>
                        <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => setHistoryPatient(p)}>
                          سوابق
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => setBpLookupCode(p.nationalCode || '')}
                        >
                          فشار خون
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ListPagination page={page} pageSize={pageSize} totalCount={totalCount} onChange={onPaginationChange} />
      </div>
    </>
  );
}

export default withAlert(PatientsPage);
