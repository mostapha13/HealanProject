import React, { useCallback, useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type {
  AppointmentBookingItem,
  DoctorSummary,
  InsuranceCompany,
  ServiceType,
} from '../../api/types';import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { HealanModal } from '../../components/HealanModal';
import { JalaliDateInput } from '../../components/JalaliDateInput';
import { JalaliDateTimeInput } from '../../components/JalaliDateTimeInput';
import { confirmDelete } from '../../components/confirmDialog';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';
import { buildAppointmentPayload, toDateTimeLocalValue } from '../../utils/apiPayload';
import { nowDateTimeLocal, todayDateInput } from '../../utils/formatJalali';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const NOTE_MAX = 100;
const STATUS_LABEL: Record<number, string> = {
  1: 'رزرو شده',
  2: 'لغو شده',
  3: 'جابجا شده',
  4: 'پذیرش شده',
  5: 'عدم حضور',
};

const STATUS_NAME: Record<string, number> = {
  Booked: 1,
  Cancelled: 2,
  Rescheduled: 3,
  Accepted: 4,
  NoShow: 5,
};

/** API may return status as number, numeric string, or enum name (JsonStringEnumConverter). */
function bookingStatus(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && asNum > 0) return asNum;
    return STATUS_NAME[trimmed] ?? 0;
  }
  return 0;
}

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
  const [services, setServices] = useState<ServiceType[]>([]);
  const [insurances, setInsurances] = useState<InsuranceCompany[]>([]);
  const [doctorId, setDoctorId] = useState(0);
  const [status, setStatus] = useState(1);
  const [filter, setFilter] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDateInput());
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState<AdmitForm>(emptyAdmitForm);

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
      const day = selectedDate || todayDateInput();
      const res = await healanApi.booking.reservationList({
        doctorId: doctorId || undefined,
        status: status || undefined,
        filterText: filter || undefined,
        nationalCode: nationalCode || undefined,
        fromDate: day,
        toDate: day,
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
  }, [doctorId, status, filter, nationalCode, selectedDate, page, pageSize, onAlert]);

  useEffect(() => {
    Promise.all([
      healanApi.doctors.listAll(),
      healanApi.services.listActive(),
      healanApi.insurance.listAll(),
    ])
      .then(([d, s, i]) => {
        setDoctors(d);
        setServices(s);
        setInsurances(i);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), filter || nationalCode ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filter, nationalCode]);

  useEffect(() => {
    setPage(1);
  }, [filter, nationalCode, doctorId, status, selectedDate, setPage]);

  const openAdmit = async (item: AppointmentBookingItem) => {
    let patientId = Number(item.patientId) || 0;
    if (patientId <= 0 && item.nationalCode) {
      try {
        const found = await healanApi.patients.byNationalCode(item.nationalCode);
        patientId = found?.patientId ?? 0;
      } catch {
        // handled below
      }
    }

    if (patientId <= 0) {
      onAlert({
        type: 'error',
        message: 'بیمار در سیستم یافت نشد. رزرو بدون بیمار معتبر نیست.',
      });
      return;
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
      note: (item.note || '').slice(0, NOTE_MAX),
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
        onAlert({ type: 'error', message: 'بیمار یا پزشک معتبر نیست.' });
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
      const note = admitForm.note.trim().slice(0, NOTE_MAX);

      const registered = await healanApi.appointments.register(
        buildAppointmentPayload({
          appointmentId: 0,
          patientId: admitForm.patientId,
          doctorId: admitForm.doctorId,
          durationMinutes: admitForm.durationMinutes,
          note,
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

  const markNoShow = async (id: number) => {
    try {
      await healanApi.booking.reservationNoShow(id);
      onAlert({ type: 'success', message: 'عدم حضور ثبت شد.' });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const removeBooking = async (id: number) => {
    if (!(await confirmDelete('این رزرو حذف شود؟'))) return;
    try {
      await healanApi.booking.reservationDelete(id);
      onAlert({ type: 'success', message: 'رزرو حذف شد.' });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="رزروهای نوبت"
        subtitle="به‌صورت پیش‌فرض نوبت‌های امروز نمایش داده می‌شود — با «پذیرش بیمار» فرم پذیرش را باز کنید"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>تاریخ نوبت</label>
              <JalaliDateInput
                value={selectedDate}
                onChange={(v) => setSelectedDate(v || todayDateInput())}
                placeholder="انتخاب تاریخ"
              />
            </div>
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
                <option value={5}>عدم حضور</option>
              </select>
            </div>
            <div className="healan-form-field">
              <label>کد ملی</label>
              <input
                className="healan-input"
                value={nationalCode}
                onChange={(e) => setNationalCode(e.target.value.replace(/[^\d۰-۹٠-٩]/g, '').slice(0, 10))}
                placeholder="جستجو با کد ملی"
                inputMode="numeric"
              />
            </div>
            <div className="healan-form-field">
              <label>جستجو</label>
              <input
                className="healan-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="نام، موبایل"
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
                  <th>دلیل مراجعه</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const st = bookingStatus(item.status);
                  return (
                  <tr key={item.appointmentBookingId}>
                    <td>{convertDateAndTimeToJalali(item.startAt)}</td>
                    <td>
                      {item.firstName} {item.lastName}
                      <div className="healan-muted">
                        {item.nationalCode} · {item.phoneNumber}
                      </div>
                    </td>
                    <td>{item.doctorName}</td>
                    <td>{item.note?.trim() || '—'}</td>
                    <td>{STATUS_LABEL[st] ?? String(item.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {st === 1 && (
                          <>
                            <button
                              type="button"
                              className="healan-btn healan-btn--primary healan-btn--sm"
                              onClick={() => void openAdmit(item)}
                            >
                              پذیرش بیمار
                            </button>
                            <button
                              type="button"
                              className="healan-btn healan-btn--muted healan-btn--sm"
                              onClick={() => void markNoShow(item.appointmentBookingId)}
                            >
                              عدم حضور
                            </button>
                            <button
                              type="button"
                              className="healan-btn healan-btn--action healan-btn--unpublish healan-btn--sm"
                              onClick={() => void cancel(item.appointmentBookingId)}
                            >
                              لغو
                            </button>
                          </>
                        )}
                        {st !== 4 && (
                          <button
                            type="button"
                            className="healan-btn healan-btn--action healan-btn--danger healan-btn--sm"
                            onClick={() => void removeBooking(item.appointmentBookingId)}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
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
        title="پذیرش بیمار"
        subtitle="اطلاعات رزرو پیش‌پر شده است — خدمات و در صورت نیاز بیمه را تکمیل کنید"
        width={980}
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
              {submitting ? 'در حال ثبت…' : 'ثبت پذیرش'}
            </button>
          </>
        }
      >
        <div className="healan-form-grid" style={{ gap: '1.25rem 1.5rem', marginBottom: 0 }}>
          <div className="healan-form-field">
            <label>نام بیمار</label>
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
          <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
            <label>دلیل مراجعه (از رزرو سایت)</label>
            <textarea
              className="healan-input"
              rows={3}
              maxLength={NOTE_MAX}
              value={admitForm.note}
              onChange={(e) => setAdmitForm({ ...admitForm, note: e.target.value.slice(0, NOTE_MAX) })}
              placeholder="دلیل مراجعه بیمار"
              style={{ resize: 'vertical', minHeight: 88 }}
            />
            <span className="healan-muted" style={{ fontSize: '0.75rem', marginTop: 6 }}>
              {admitForm.note.length}/{NOTE_MAX}
            </span>
          </div>
          <div className="healan-form-field" style={{ gridColumn: '1 / -1' }}>
            <label>خدمات</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', marginTop: 8 }}>
              {services.map((s) => (
                <label
                  key={s.serviceTypeId}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
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
        </div>
      </HealanModal>
    </>
  );
}

export default withAlert(BookingReservationsPage);
