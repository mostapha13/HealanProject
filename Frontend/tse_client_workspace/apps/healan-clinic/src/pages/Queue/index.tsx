import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import { PageHeader, StatusBadge } from '../../components/Ui';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  AppointmentStatus,
  AppointmentSummary,
} from '../../api/types';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { appointmentDoctorName, appointmentInsuranceDisplay, appointmentCanStartVisit, appointmentPatientDisplay, appointmentPaymentColor, appointmentPaymentLabel } from '../../utils/appointmentDisplay';
import { useNavigate } from '@tse/utils';

function QueuePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppointmentSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.appointments.todayAll({ filterText: filter });
      setItems(res);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, filter ? 300 : 0);
    return () => clearTimeout(timer);
  }, [filter]);

  const changeStatus = async (appointmentId: number, status: AppointmentStatus) => {
    try {
      await healanApi.appointments.changeStatus({ appointmentId, appointmentTypeId: status });
      await load();
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader title="صف انتظار" subtitle="مدیریت وضعیت نوبت‌های امروز" />

      <div className="healan-search-bar">
        <input
          placeholder="جستجو بر اساس نام، نام خانوادگی یا کد ملی..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="healan-card">
        <div className="healan-card__body" style={{ padding: 0 }}>
          {loading ? (
            <div className="healan-empty">در حال بارگذاری...</div>
          ) : items.length === 0 ? (
            <div className="healan-empty">نوبتی یافت نشد</div>
          ) : (
            items.map((item) => {
              const status = item.appointmentTypeId as AppointmentStatus;
              return (
                <div key={item.appointmentId} className="healan-queue-item">
                  <div className="healan-queue-item__info">
                    <h4>{appointmentPatientDisplay(item)}</h4>
                    <p>{appointmentDoctorName(item)} · <span>{convertDateAndTimeToJalali(item.appointmentDate)}</span></p>
                    <p className="healan-queue-item__meta">بیمه: {appointmentInsuranceDisplay(item)}</p>
                  </div>
                  <div className="healan-actions">
                    <StatusBadge
                      label={appointmentPaymentLabel(item)}
                      color={appointmentPaymentColor(item)}
                    />
                    <StatusBadge
                      label={APPOINTMENT_STATUS_LABELS[status] ?? status}
                      color={APPOINTMENT_STATUS_COLORS[status] ?? '#6b7280'}
                    />
                    {status === 'Scheduled' && (
                      <>
                        {appointmentCanStartVisit(item) ? (
                          <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'InProgress')}>شروع ویزیت</button>
                        ) : (
                          <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => navigate(`/appointments/${item.appointmentId}`)}>پرداخت</button>
                        )}
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'NoShow')}>عدم حضور</button>
                      </>
                    )}
                    {status === 'InProgress' && (
                      <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'Completed')}>پایان ویزیت</button>
                    )}
                    <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => navigate(`/appointments/${item.appointmentId}`)}>پرونده ویزیت</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(QueuePage);
