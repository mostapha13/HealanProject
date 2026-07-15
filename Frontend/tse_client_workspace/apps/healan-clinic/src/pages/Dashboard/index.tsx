import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { DashboardStats, AppointmentSummary, AppointmentStatus } from '../../api/types';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '../../api/types';
import { PageHeader, StatCard, formatCurrency, formatNumber } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate } from '@tse/utils';
import { appointmentDoctorDisplay, appointmentInsuranceDisplay, appointmentPatientDisplay } from '../../utils/appointmentDisplay';

function Dashboard({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([
        healanApi.dashboard.stats(),
        healanApi.appointments.today({ pageNumber: 1, pageSize: 8 }),
      ]);
      setStats(statsRes);
      setQueue(queueRes.items ?? []);
    } catch (err) {
      onAlert(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="healan-empty">
        <p>در حال بارگذاری داشبورد...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="داشبورد کلینیک"
        subtitle={`امروز ${convertDateAndTimeToJalali(new Date().toISOString())}`}
        action={
          <button
            type="button"
            className="healan-btn healan-btn--primary"
            onClick={() => navigate('/appointments')}
          >
            + پذیرش جدید
          </button>
        }
      />

      <div className="healan-stats-grid">
        <StatCard label="نوبت‌های امروز" value={formatNumber(stats.todayAppointments)} icon="📅" color="#0d9488" />
        <StatCard label="در انتظار" value={formatNumber(stats.waitingAppointments)} icon="⏳" color="#f59e0b" />
        <StatCard label="در حال ویزیت" value={formatNumber(stats.inProgressAppointments)} icon="🩺" color="#3b82f6" />
        <StatCard label="انجام شده" value={formatNumber(stats.completedToday)} icon="✅" color="#10b981" />
        <StatCard label="بیماران" value={formatNumber(stats.totalPatients)} icon="👥" color="#6366f1" />
        <StatCard label="پزشکان" value={formatNumber(stats.totalDoctors)} icon="👨‍⚕️" color="#8b5cf6" />
        <StatCard label="درآمد امروز" value={formatCurrency(stats.todayRevenue)} icon="💰" color="#059669" />
        <StatCard label="پرداخت نشده" value={formatNumber(stats.pendingPayments)} icon="⚠️" color="#ef4444" />
      </div>

      <div className="healan-card">
        <div className="healan-card__header">
          <h3>صف انتظار امروز</h3>
          <button
            type="button"
            className="healan-btn healan-btn--outline healan-btn--sm"
            onClick={() => navigate('/queue')}
          >
            مشاهده همه
          </button>
        </div>
        <div className="healan-card__body" style={{ padding: 0 }}>
          {queue.length === 0 ? (
            <div className="healan-empty">نوبتی برای امروز ثبت نشده است</div>
          ) : (
            queue.map((item) => {
              const status = item.appointmentTypeId as AppointmentStatus;
              return (
                <div key={item.appointmentId} className="healan-queue-item">
                  <div className="healan-queue-item__info">
                    <h4>{appointmentPatientDisplay(item)}</h4>
                    <p>
                      پزشک: {appointmentDoctorDisplay(item)} · <span>{convertDateAndTimeToJalali(item.appointmentDate)}</span>
                    </p>
                    <p className="healan-queue-item__meta">بیمه: {appointmentInsuranceDisplay(item)}</p>
                  </div>
                  <div className="healan-actions">
                    <span
                      className="healan-badge"
                      style={{
                        background: `${APPOINTMENT_STATUS_COLORS[status] ?? '#6b7280'}18`,
                        color: APPOINTMENT_STATUS_COLORS[status] ?? '#6b7280',
                      }}
                    >
                      {APPOINTMENT_STATUS_LABELS[status] ?? status}
                    </span>
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

export default withAlert(Dashboard);
