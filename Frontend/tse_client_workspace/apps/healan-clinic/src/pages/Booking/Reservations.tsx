import React, { useCallback, useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { AppointmentBookingItem, DoctorSummary, ServiceType } from '../../api/types';
import { PageHeader } from '../../components/Ui';
import { SearchableSelect } from '../../components/SearchableSelect';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate } from '@tse/utils';
import { HEALAN_LIST_PAGE_SIZE, ListPagination, useListPagination } from '../../components/ListPagination';

const STATUS_LABEL: Record<number, string> = {
  1: 'رزرو شده',
  2: 'لغو شده',
  3: 'جابجا شده',
  4: 'پذیرش شده',
};

function BookingReservationsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppointmentBookingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [doctorId, setDoctorId] = useState(0);
  const [status, setStatus] = useState(0);
  const [filter, setFilter] = useState('');
  const { page, pageSize, setPage, onPaginationChange } = useListPagination(HEALAN_LIST_PAGE_SIZE);
  const [manual, setManual] = useState({
    appointmentSlotId: 0,
    nationalCode: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    note: '',
    serviceTypeIds: [] as number[],
  });

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
    Promise.all([healanApi.doctors.listAll(), healanApi.services.listActive()])
      .then(([d, s]) => {
        setDoctors(d);
        setServices(s);
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

  const accept = async (id: number) => {
    try {
      const res = await healanApi.booking.reservationAccept(id);
      onAlert({ type: 'success', message: 'رزرو برای پذیرش آماده شد.' });
      navigate(res.registerPath || '/appointments');
    } catch (err) {
      onAlert(err);
    }
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

  const createManual = async () => {
    if (!manual.appointmentSlotId) {
      onAlert({ type: 'error', message: 'شناسه اسلات لازم است.' });
      return;
    }
    try {
      await healanApi.booking.reservationCreate({
        ...manual,
        bookedByStaff: true,
        requestedServiceTypeIds: manual.serviceTypeIds,
      });
      onAlert({ type: 'success', message: 'رزرو دستی ثبت شد.' });
      setManual({
        appointmentSlotId: 0,
        nationalCode: '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
        note: '',
        serviceTypeIds: [],
      });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  const toggleService = (id: number) => {
    setManual((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  return (
    <>
      <PageHeader
        title="رزروهای نوبت"
        subtitle="مشاهده، لغو، و ارسال رزرو به فرم پذیرش موجود"
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

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header">
          <h3>رزرو دستی روی اسلات</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>شناسه اسلات</label>
              <input
                className="healan-input"
                type="number"
                value={manual.appointmentSlotId || ''}
                onChange={(e) => setManual({ ...manual, appointmentSlotId: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="healan-form-field">
              <label>کد ملی</label>
              <input
                className="healan-input"
                value={manual.nationalCode}
                onChange={(e) => setManual({ ...manual, nationalCode: e.target.value })}
              />
            </div>
            <div className="healan-form-field">
              <label>موبایل</label>
              <input
                className="healan-input"
                value={manual.phoneNumber}
                onChange={(e) => setManual({ ...manual, phoneNumber: e.target.value })}
              />
            </div>
            <div className="healan-form-field">
              <label>نام</label>
              <input
                className="healan-input"
                value={manual.firstName}
                onChange={(e) => setManual({ ...manual, firstName: e.target.value })}
              />
            </div>
            <div className="healan-form-field">
              <label>نام خانوادگی</label>
              <input
                className="healan-input"
                value={manual.lastName}
                onChange={(e) => setManual({ ...manual, lastName: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label>عنوان خدمت درخواستی</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 6 }}>
              {services.map((s) => (
                <label key={s.serviceTypeId} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={manual.serviceTypeIds.includes(s.serviceTypeId)}
                    onChange={() => toggleService(s.serviceTypeId)}
                  />
                  {s.title}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            style={{ marginTop: '1rem' }}
            onClick={() => void createManual()}
          >
            ثبت رزرو دستی
          </button>
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
                  <th></th>
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {item.status === 1 && (
                        <>
                          <button
                            type="button"
                            className="healan-btn healan-btn--primary healan-btn--sm"
                            onClick={() => void accept(item.appointmentBookingId)}
                          >
                            ارسال به پذیرش
                          </button>{' '}
                          <button
                            type="button"
                            className="healan-btn healan-btn--ghost healan-btn--sm"
                            onClick={() => void cancel(item.appointmentBookingId)}
                          >
                            لغو
                          </button>
                        </>
                      )}
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
    </>
  );
}

export default withAlert(BookingReservationsPage);
