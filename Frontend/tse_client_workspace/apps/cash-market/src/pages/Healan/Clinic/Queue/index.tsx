import React, { useEffect, useState } from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import healanApi from 'apps/cash-market/src/Controller/Healan/api';
import { PageHeader, StatusBadge } from '../components/Ui';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  AppointmentStatus,
  AppointmentSummary,
} from 'apps/cash-market/src/Controller/Healan/types';
import { convertDateAndTimeToJalali } from '@tse/tools';

function QueuePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [items, setItems] = useState<AppointmentSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healanApi.appointments.today({
        filterText: filter,
        pageNumber: 1,
        pageSize: 50,
      });
      setItems(res.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
          placeholder="جستجو با نام یا کد ملی..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button type="button" className="healan-btn healan-btn--primary" onClick={load}>
          جستجو
        </button>
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
                    <h4>{item.patientName ?? '—'}</h4>
                    <p>
                      {item.doctorName ?? '—'} · {convertDateAndTimeToJalali(item.appointmentDate)}
                    </p>
                  </div>
                  <div className="healan-actions">
                    <StatusBadge
                      status={status}
                      label={APPOINTMENT_STATUS_LABELS[status] ?? status}
                      color={APPOINTMENT_STATUS_COLORS[status] ?? '#6b7280'}
                    />
                    {status === 'Scheduled' && (
                      <button
                        type="button"
                        className="healan-btn healan-btn--primary healan-btn--sm"
                        onClick={() => changeStatus(item.appointmentId, 'InProgress')}
                      >
                        شروع ویزیت
                      </button>
                    )}
                    {status === 'InProgress' && (
                      <button
                        type="button"
                        className="healan-btn healan-btn--primary healan-btn--sm"
                        onClick={() => changeStatus(item.appointmentId, 'Completed')}
                      >
                        پایان ویزیت
                      </button>
                    )}
                    {status === 'Scheduled' && (
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        onClick={() => changeStatus(item.appointmentId, 'NoShow')}
                      >
                        عدم حضور
                      </button>
                    )}
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
