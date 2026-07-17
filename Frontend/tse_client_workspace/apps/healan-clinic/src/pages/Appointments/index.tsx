import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type {
  AppointmentSummary,
  DoctorSummary,
  InsuranceCompany,
  PatientSummary,
  ServiceType,
} from '../../api/types';
import { PageHeader, formatCurrency } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { nowDateTimeLocal } from '../../utils/formatJalali';
import { buildAppointmentPayload, toDateTimeLocalValue } from '../../utils/apiPayload';
import { SearchableSelect } from '../../components/SearchableSelect';
import { JalaliDateTimeInput } from '../../components/JalaliDateTimeInput';
import { useNavigate, useLocation } from '@tse/utils';
import { appointmentDoctorDisplay, appointmentInsuranceDisplay, appointmentInvoice, appointmentPatientName, appointmentPatientNationalCode, appointmentIsPaid } from '../../utils/appointmentDisplay';
import { QuickAddPatientModal } from '../../components/QuickAddPatientModal';
import { QuickAddDoctorModal } from '../../components/QuickAddDoctorModal';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

function createInitialAppointmentForm() {
  return {
    appointmentId: 0,
    patientId: 0,
    doctorId: 0,
    durationMinutes: 30,
    note: '',
    primaryInsuranceCompanyId: null as number | null,
    confirmPrimaryInsuranceCompany: false,
    secondInsuranceCompanyId: null as number | null,
    confirmSecondInsuranceCompany: false,
    serviceTypeIds: [] as number[],
    appointmentDate: nowDateTimeLocal(),
  };
}

function AppointmentsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const { submitting, guard } = useAsyncSubmit();
  const [totalCount, setTotalCount] = useState(0);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [form, setForm] = useState(createInitialAppointmentForm);

  const refreshPatients = async () => {
    const list = await healanApi.patients.listAll();
    setPatients(list);
    return list;
  };

  const refreshDoctors = async () => {
    const list = await healanApi.doctors.listAll();
    setDoctors(list);
    return list;
  };

  const openPatientQuickAdd = () => {
    setPatientModalOpen(true);
  };

  const openDoctorQuickAdd = () => {
    setDoctorModalOpen(true);
  };

  const handlePatientAdded = async (patientId: number) => {
    await refreshPatients();
    setShowForm(true);
    setForm((prev) => ({ ...prev, patientId }));
  };

  const handleDoctorAdded = async (doctorId: number) => {
    await refreshDoctors();
    setShowForm(true);
    setForm((prev) => ({ ...prev, doctorId }));
  };

  const openForm = async () => {
    setForm(createInitialAppointmentForm());
    try {
      const activeServices = await healanApi.services.listActive();
      setServices(activeServices);
    } catch {
      // keep previous list if refresh fails
    }
    setShowForm(true);
  };

  const mergeServicesForForm = (activeServices: ServiceType[], selected?: ServiceType[]) => {
    const merged = [...activeServices];
    (selected ?? []).forEach((service) => {
      if (!merged.some((item) => item.serviceTypeId === service.serviceTypeId)) {
        merged.push(service);
      }
    });
    return merged;
  };

  const openEdit = async (appointmentId: number) => {
    try {
      const info = await healanApi.appointments.info(appointmentId);
      const activeServices = await healanApi.services.listActive();
      setServices(mergeServicesForForm(activeServices, info.serviceTypes));
      setForm({
        appointmentId: info.appointmentId,
        patientId: info.patientId,
        doctorId: info.doctorId,
        durationMinutes: info.durationMinutes ?? 30,
        note: info.note ?? '',
        primaryInsuranceCompanyId: info.primaryInsuranceCompany?.insuranceCompanyId ?? null,
        confirmPrimaryInsuranceCompany: info.confirmPrimaryInsuranceCompany ?? false,
        secondInsuranceCompanyId: info.secondInsuranceCompany?.insuranceCompanyId ?? null,
        confirmSecondInsuranceCompany: info.confirmSecondInsuranceCompany ?? false,
        serviceTypeIds: info.serviceTypes?.map((s) => s.serviceTypeId) ?? [],
        appointmentDate: toDateTimeLocalValue(info.appointmentDate) || nowDateTimeLocal(),
      });
      setShowForm(true);
    } catch (err) {
      onAlert(err);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healanApi.appointments.list({
        filterText: filter || undefined,
        pageNumber: page,
        pageSize,
      });
      setAppointments(res.items ?? []);
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

  useEffect(() => {
    Promise.all([
      healanApi.patients.listAll(),
      healanApi.doctors.listAll(),
      healanApi.services.listActive(),
      healanApi.insurance.listAll(),
    ]).then(([p, d, s, i]) => {
      setPatients(p);
      setDoctors(d);
      setServices(s);
      setInsurances(i);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      void openEdit(+editId);
      return;
    }

    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    void (async () => {
      try {
        const activeServices = await healanApi.services.listActive();
        setServices(activeServices);

        let patientId = Number(params.get('patientId') || 0);
        const nationalCode = params.get('nationalCode') || '';
        if (patientId <= 0 && nationalCode) {
          try {
            const found = await healanApi.patients.byNationalCode(nationalCode);
            patientId = found?.patientId ?? 0;
            if (patientId > 0) {
              setPatients((prev) =>
                prev.some((p) => p.patientId === patientId) ? prev : [...prev, found]
              );
            }
          } catch {
            // patient may not exist yet — secretary can quick-add
          }
        }

        const serviceTypeIds = (params.get('serviceTypeIds') || '')
          .split(',')
          .map((x) => Number(x))
          .filter((x) => x > 0);

        const appointmentDateRaw = params.get('appointmentDate');
        setForm({
          ...createInitialAppointmentForm(),
          patientId,
          doctorId: Number(params.get('doctorId') || 0),
          durationMinutes: Number(params.get('durationMinutes') || 30) || 30,
          note: params.get('note') || `رزرو پورتال #${bookingId}`,
          serviceTypeIds,
          appointmentDate: appointmentDateRaw
            ? toDateTimeLocalValue(appointmentDateRaw) || nowDateTimeLocal()
            : nowDateTimeLocal(),
        });
        setShowForm(true);
      } catch (err) {
        onAlert(err);
      }
    })();
  }, [location.search]);

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  const handleSave = () => {
    void guard(async () => {
      if (form.patientId <= 0 || form.doctorId <= 0) {
        onAlert({ type: 'error', message: 'بیمار و پزشک را انتخاب کنید' });
        return;
      }
      if (form.serviceTypeIds.length === 0) {
        onAlert({ type: 'error', message: 'حداقل یک خدمت انتخاب کنید' });
        return;
      }
      if (!form.appointmentDate?.trim()) {
        onAlert({ type: 'error', message: 'تاریخ و ساعت نوبت را انتخاب کنید' });
        return;
      }
      await healanApi.appointments.register(buildAppointmentPayload(form));
      setShowForm(false);
      await load();
    }).catch((err) => onAlert(err));
  };

  const handlePay = async (appointmentId: number) => {
    try {
      const invoice = await healanApi.appointments.invoice(appointmentId) as { invoiceId: number };
      await healanApi.appointments.pay({
        invoiceId: invoice.invoiceId,
        paymentReference: `PAY-${Date.now()}`,
        paymentMethodTypeId: 'Cash',
      });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="پذیرش و نوبت‌دهی"
        subtitle="ثبت نوبت، محاسبه هزینه و پرداخت"
        action={
          <div className="healan-page-header__actions">
            <button type="button" className="healan-btn healan-btn--outline" onClick={openPatientQuickAdd}>
              + بیمار جدید
            </button>
            <button type="button" className="healan-btn healan-btn--outline" onClick={openDoctorQuickAdd}>
              + پزشک جدید
            </button>
            <button type="button" className="healan-btn healan-btn--primary" onClick={openForm}>
              + پذیرش جدید
            </button>
          </div>
        }
      />

      {showForm && (
        <div className="healan-card" style={{ marginBottom: '1.5rem' }}>
          <div className="healan-card__header"><h3>{form.appointmentId > 0 ? 'ویرایش نوبت / افزودن خدمت' : 'فرم پذیرش بیمار'}</h3></div>
          <div className="healan-card__body">
            <div className="healan-form-grid">
              <div className="healan-form-field">
                <label>بیمار</label>
                <SearchableSelect
                  value={form.patientId}
                  onChange={(v) => setForm({ ...form, patientId: v ?? 0 })}
                  placeholder="انتخاب بیمار"
                  options={patients.map((p) => ({
                    value: p.patientId,
                    label: `${p.firstName} ${p.lastName} — ${p.nationalCode}`,
                  }))}
                />
              </div>
              <div className="healan-form-field">
                <label>پزشک</label>
                <SearchableSelect
                  value={form.doctorId}
                  onChange={(v) => setForm({ ...form, doctorId: v ?? 0 })}
                  placeholder="انتخاب پزشک"
                  options={doctors.map((d) => ({
                    value: d.doctorId,
                    label: `${d.firstName} ${d.lastName}`,
                  }))}
                />
              </div>
              <div className="healan-form-field">
                <label>تاریخ و ساعت</label>
                <JalaliDateTimeInput
                  value={form.appointmentDate}
                  onChange={(appointmentDate) => setForm({ ...form, appointmentDate })}
                />
              </div>
              <div className="healan-form-field">
                <label>مدت (دقیقه)</label>
                <input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} />
              </div>
              <div className="healan-form-field">
                <label>بیمه پایه</label>
                <SearchableSelect
                  value={form.primaryInsuranceCompanyId}
                  onChange={(v) => setForm({ ...form, primaryInsuranceCompanyId: v })}
                  placeholder="بدون بیمه"
                  options={insurances.map((ins) => ({
                    value: ins.insuranceCompanyId,
                    label: ins.name,
                  }))}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>خدمات</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {services.map((s) => (
                  <label key={s.serviceTypeId} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', opacity: s.isActive === false ? 0.65 : 1 }}>
                    <input
                      type="checkbox"
                      checked={form.serviceTypeIds.includes(s.serviceTypeId)}
                      onChange={() => toggleService(s.serviceTypeId)}
                      disabled={s.isActive === false}
                    />
                    {s.title}
                    {s.isActive === false ? ' (غیرفعال)' : ''}
                  </label>
                ))}
              </div>
            </div>
            <div className="healan-form-field" style={{ marginTop: '1rem' }}>
              <label>یادداشت</label>
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              پرداخت می‌تواند قبل یا بعد از ویزیت انجام شود. با افزودن خدمت جدید حین ویزیت، فاکتور مکمل ایجاد می‌شود.
            </p>
            <div className="healan-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="healan-btn healan-btn--primary" disabled={submitting} onClick={handleSave}>
                {submitting ? 'در حال ذخیره...' : form.appointmentId > 0 ? 'ذخیره تغییرات' : 'ثبت نوبت'}
              </button>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowForm(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div className="healan-search-bar">
        <input
          placeholder="جستجو بر اساس نام، نام خانوادگی یا کد ملی..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>بیمار</th>
                  <th>کد ملی</th>
                  <th>پزشک</th>
                  <th>بیمه</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>مبلغ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const inv = appointmentInvoice(a);
                  const isPaid = appointmentIsPaid(a);
                  return (
                    <tr key={a.appointmentId}>
                      <td>{appointmentPatientName(a)}</td>
                      <td>{appointmentPatientNationalCode(a)}</td>
                      <td>{appointmentDoctorDisplay(a)}</td>
                      <td>{appointmentInsuranceDisplay(a)}</td>
                      <td><span>{convertDateAndTimeToJalali(a.appointmentDate)}</span></td>
                      <td>{a.appointmentTypeName ?? a.appointmentTypeId}</td>
                      <td>{inv ? formatCurrency(inv.patientPayable) : '—'}</td>
                      <td>
                        <div className="healan-actions">
                          {!isPaid && inv && (
                            <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => handlePay(a.appointmentId)}>پرداخت</button>
                          )}
                          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void openEdit(a.appointmentId)}>ویرایش</button>
                          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>پرونده ویزیت</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <ListPagination page={page} pageSize={pageSize} totalCount={totalCount} onChange={onPaginationChange} />
      </div>

      <QuickAddPatientModal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSuccess={(patientId) => void handlePatientAdded(patientId)}
        onAlert={onAlert}
      />

      <QuickAddDoctorModal
        open={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSuccess={(doctorId) => void handleDoctorAdded(doctorId)}
        onAlert={onAlert}
      />
    </>
  );
}

export default withAlert(AppointmentsPage);
