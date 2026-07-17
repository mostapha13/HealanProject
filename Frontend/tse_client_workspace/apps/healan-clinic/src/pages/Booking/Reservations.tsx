import React, { useCallback, useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type {
  AppointmentBookingItem,
  DoctorSummary,
  InsuranceCompany,
  PatientSummary,
  ServiceType,
} from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanModal } from '../../components/HealanModal';
import { JalaliDateTimeInput } from '../../components/JalaliDateTimeInput';
import { QuickAddPatientModal } from '../../components/QuickAddPatientModal';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { buildAppointmentPayload, toDateTimeLocalValue } from '../../utils/apiPayload';
import { nowDateTimeLocal } from '../../utils/formatJalali';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUS_LABEL: Record<number, string> = {
  1: 'رزرو شده',
  2: 'لغو شده',
  3: 'جابجا شده',
  4: 'پذیرش شده',
};

type AdmitForm = {
  bookingId: number;
  patientId: number;
  doctorId: number;
  durationMinutes: number;
  note: string;
  primaryInsuranceCompanyId: number | null;
  confirmPrimaryInsuranceCompany: boolean;
  secondInsuranceCompanyId: number | null;
  confirmSecondInsuranceCompany: boolean;
  serviceTypeIds: number[];
  appointmentDate: string;
  nationalCode: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  doctorName: string;
};

function emptyAdmitForm(): AdmitForm {
  return {
    bookingId: 0,
    patientId: 0,
    doctorId: 0,
    durationMinutes: 30,
    note: '',
    primaryInsuranceCompanyId: null,
    confirmPrimaryInsuranceCompany: false,
    secondInsuranceCompanyId: null,
    confirmSecondInsuranceCompany: false,
    serviceTypeIds: [],
    appointmentDate: nowDateTimeLocal(),
    nationalCode: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    doctorName: '',
  };
}

function BookingReservationsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { submitting, guard } = useAsyncSubmit();
  const [items, setItems] = useState<AppointmentBookingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>([]);
  const [doctorId, setDoctorId] = useState(0);
  const [status, setStatus] = useState(1);
  const [filter, setFilter] = useState('');
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState<AdmitForm>(emptyAdmitForm);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  const doctorOptions = useMemo(
    () =>
      doctors.map((d) => ({
        value: d.doctorId,
        label: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || `پزشک ${d.doctorId}`,
      })),
    [doctors]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await healanApi.booking.reservationList({
        doctorId: doctorId || undefined,
        status: status || undefined,
        filterText: filter || undefined,
        pageNumber: page,
        pageSize,
      });
      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  }, [doctorId, status, filter, page, pageSize, onAlert]);

  useEffect(() => {
    Promise.all([
      healanApi.doctors.listAll(),
      healanApi.services.listActive(),
      healanApi.patients.listAll(),
      healanApi.insurance.listAll(),
    ])
      .then(([d, s, p, i]) => {
        setDoctors(d);
        setServices(s);
        setPatients(p);
        setInsurances(i);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), filter ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filter]);

  useEffect(() => {
    setPage(1);
  }, [filter, doctorId, status, setPage]);

  const openAdmit = async (item: AppointmentBookingItem) => {
    let patientId = item.patientId ?? 0;
    if (patientId <= 0 && item.nationalCode) {
      try {
        const found = await healanApi.patients.byNationalCode(item.nationalCode);
        patientId = found?.patientId ?? 0;
        if (patientId > 0) {
          setPatients((prev) => (prev.some((p) => p.patientId === patientId) ? prev : [...prev, found]));
        }
      } catch {
        // secretary can quick-add
      }
    }

    const duration =
      item.startAt && item.endAt
        ? Math.max(5, Math.round((new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 60000))
        : 30;

    setAdmitForm({
      bookingId: item.appointmentBookingId,
      patientId,
      doctorId: item.doctorId,
      durationMinutes: duration || 30,
      note: item.note || `رزرو آنلاین #${item.appointmentBookingId}`,
      primaryInsuranceCompanyId: null,
      confirmPrimaryInsuranceCompany: false,
      secondInsuranceCompanyId: null,
      confirmSecondInsuranceCompany: false,
      serviceTypeIds: item.requestedServiceTypeIds ?? [],
      appointmentDate: toDateTimeLocalValue(item.startAt) || nowDateTimeLocal(),
      nationalCode: item.nationalCode,
      phoneNumber: item.phoneNumber,
      firstName: item.firstName,
      lastName: item.lastName,
      doctorName: item.doctorName || '',
    });
    setAdmitOpen(true);
  };

  const toggleService = (id: number) => {
    setAdmitForm((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  const submitAdmit = () => {
    void guard(async () => {
      if (admitForm.patientId <= 0 || admitForm.doctorId <= 0) {
        onAlert({ type: 'error', message: 'بیمار و پزشک را انتخاب کنید.' });
        return;
      }
      if (admitForm.serviceTypeIds.length === 0) {
        onAlert({ type: 'error', message: 'حداقل یک خدمت انتخاب کنید.' });
        return;
      }
      if (!admitForm.appointmentDate?.trim()) {
        onAlert({ type: 'error', message: 'تاریخ و ساعت نوبت را انتخاب کنید.' });
        return;
      }

      const registered = await healanApi.appointments.register(
        buildAppointmentPayload({
          appointmentId: 0,
          patientId: admitForm.patientId,
          doctorId: admitForm.doctorId,
          durationMinutes: admitForm.durationMinutes,
          note: admitForm.note,
          primaryInsuranceCompanyId: admitForm.primaryInsuranceCompanyId,
          confirmPrimaryInsuranceCompany: !!admitForm.primaryInsuranceCompanyId,
          secondInsuranceCompanyId: admitForm.secondInsuranceCompanyId,
          confirmSecondInsuranceCompany: !!admitForm.secondInsuranceCompanyId,
          serviceTypeIds: admitForm.serviceTypeIds,
          appointmentDate: admitForm.appointmentDate,
        })
      );

      await healanApi.booking.reservationAccept(admitForm.bookingId, registered.appointmentId);

      onAlert({ type: 'success', message: 'نوبت بیمار ثبت شد.' });
      setAdmitOpen(false);
      setAdmitForm(emptyAdmitForm());
      await load();
    }).catch((err) => onAlert(err));
  };

  const cancel = async (id: number) => {
    try {
      await healanApi.booking.reservationCancel(id);
      onAlert({ type: 'success', message: 'رزرو لغو شد.' });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const handlePatientAdded = async (patientId: number) => {
    const list = await healanApi.patients.listAll();
    setPatients(list);
    setAdmitForm((prev) => ({ ...prev, patientId }));
    setPatientModalOpen(false);
  };

  const patientInitialValues = useMemo(
    () => ({
      firstName: admitForm.firstName,
      lastName: admitForm.lastName,
      nationalCode: admitForm.nationalCode,
      phoneNumber: admitForm.phoneNumber,
    }),
    [admitForm.firstName, admitForm.lastName, admitForm.nationalCode, admitForm.phoneNumber]
  );

  return (
    <>
      <PageHeader
        title="رزروهای نوبت"
        subtitle="رزروهای آنلاین پورتال — با «ثبت نوبت» فرم پذیرش را باز کنید و نوبت را نهایی کنید"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>پزشک</label>
              <SearchableSelect
                options={[{ value: 0, label: 'همه' }, ...doctorOptions]}
                value={doctorId}
                onChange={(v) => setDoctorId(Number(v) || 0)}
                placeholder="همه پزشکان"
              />
            </div>
            <div className="healan-form-field">
              <label>وضعیت</label>
              <select className="healan-input" value={status} onChange={(e) => setStatus(Number(e.target.value))}>
                <option value={0}>همه</option>
                <option value={1}>رزرو شده</option>
                <option value={2}>لغو شده</option>
                <option value={3}>جابجا شده</option>
                <option value={4}>پذیرش شده</option>
              </select>
            </div>
            <div className="healan-form-field">
              <label>جستجو</label>
              <input
                className="healan-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="نام، کد ملی، موبایل"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__body">
          {loading ? (
            <div className="healan-empty">در حال بارگذاری…</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">رزروی یافت نشد.</div>
          ) : (
            <table className="healan-table">
              <thead>
                <tr>
                  <th>زمان</th>
                  <th>بیمار</th>
                  <th>پزشک</th>
                  <th>خدمات درخواستی</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.appointmentBookingId}>
                    <td>{convertDateAndTimeToJalali(item.startAt)}</td>
                    <td>
                      {item.firstName} {item.lastName}
                      <div style={{ color: '#64748b', fontSize: 12 }}>
                        {item.nationalCode} · {item.phoneNumber}
                      </div>
                    </td>
                    <td>{item.doctorName}</td>
                    <td>{(item.requestedServiceTitles ?? []).join('، ') || '—'}</td>
                    <td>{STATUS_LABEL[item.status] ?? item.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.status === 1 && (
                          <>
                            <button
                              type="button"
                              className="healan-btn healan-btn--primary healan-btn--sm"
                              onClick={() => void openAdmit(item)}
                            >
                              ثبت نوبت
                            </button>
                            <button
                              type="button"
                              className="healan-btn healan-btn--ghost healan-btn--sm"
                              onClick={() => void cancel(item.appointmentBookingId)}
                            >
                              لغو
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <ListPagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onChange={onPaginationChange}
          />
        </div>
      </div>

      <HealanModal
        open={admitOpen}
        title="فرم پذیرش بیمار"
        subtitle="اطلاعات رزرو آنلاین پیش‌پر شده است — بقیه فیلدها را تکمیل و ثبت کنید"
        width={760}
        onClose={() => setAdmitOpen(false)}
        footer={
          <>
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => setAdmitOpen(false)}>
              انصراف
            </button>
            <button
              type="button"
              className="healan-btn healan-btn--primary"
              disabled={submitting}
              onClick={submitAdmit}
            >
              {submitting ? 'در حال ثبت…' : 'ثبت نوبت'}
            </button>
          </>
        }
      >
        <div className="healan-form-grid" style={{ marginBottom: '1rem' }}>
          <div className="healan-form-field">
            <label>نام بیمار (از رزرو)</label>
            <input
              className="healan-input"
              readOnly
              value={`${admitForm.firstName} ${admitForm.lastName}`.trim()}
            />
          </div>
          <div className="healan-form-field">
            <label>کد ملی / موبایل</label>
            <input
              className="healan-input"
              readOnly
              value={`${admitForm.nationalCode} · ${admitForm.phoneNumber}`}
            />
          </div>
          <div className="healan-form-field">
            <label>پزشک</label>
            <SearchableSelect
              value={admitForm.doctorId}
              onChange={(v) => setAdmitForm({ ...admitForm, doctorId: v ?? 0 })}
              placeholder="انتخاب پزشک"
              options={doctorOptions}
            />
          </div>
          <div className="healan-form-field">
            <label>بیمار در سیستم</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={admitForm.patientId}
                  onChange={(v) => setAdmitForm({ ...admitForm, patientId: v ?? 0 })}
                  placeholder="انتخاب بیمار"
                  options={patients.map((p) => ({
                    value: p.patientId,
                    label: `${p.firstName} ${p.lastName} — ${p.nationalCode}`,
                  }))}
                />
              </div>
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => setPatientModalOpen(true)}>
                + بیمار
              </button>
            </div>
          </div>
          <div className="healan-form-field">
            <label>تاریخ و ساعت</label>
            <JalaliDateTimeInput
              value={admitForm.appointmentDate}
              onChange={(appointmentDate) => setAdmitForm({ ...admitForm, appointmentDate })}
            />
          </div>
          <div className="healan-form-field">
            <label>مدت (دقیقه)</label>
            <input
              className="healan-input"
              type="number"
              value={admitForm.durationMinutes}
              onChange={(e) => setAdmitForm({ ...admitForm, durationMinutes: Number(e.target.value) || 30 })}
            />
          </div>
          <div className="healan-form-field">
            <label>بیمه پایه</label>
            <SearchableSelect
              value={admitForm.primaryInsuranceCompanyId}
              onChange={(v) => setAdmitForm({ ...admitForm, primaryInsuranceCompanyId: v })}
              placeholder="بدون بیمه"
              options={insurances.map((ins) => ({
                value: ins.insuranceCompanyId,
                label: ins.name,
              }))}
            />
          </div>
          <div className="healan-form-field">
            <label>یادداشت</label>
            <input
              className="healan-input"
              value={admitForm.note}
              onChange={(e) => setAdmitForm({ ...admitForm, note: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>خدمات</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {services.map((s) => (
              <label
                key={s.serviceTypeId}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
              >
                <input
                  type="checkbox"
                  checked={admitForm.serviceTypeIds.includes(s.serviceTypeId)}
                  onChange={() => toggleService(s.serviceTypeId)}
                />
                {s.title}
              </label>
            ))}
          </div>
        </div>
      </HealanModal>

      <QuickAddPatientModal
        open={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSuccess={(id) => void handlePatientAdded(id)}
        onAlert={onAlert}
        initialValues={patientInitialValues}
      />
    </>
  );
}

export default withAlert(BookingReservationsPage);
