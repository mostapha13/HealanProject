import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { DashboardStats } from '../../api/types';
import { PageHeader, StatCard, formatCurrency, formatNumber } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';

function ReportsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    healanApi.dashboard.stats().then(setStats).catch(onAlert);
  }, []);

  if (!stats) return <div className="healan-empty">در حال بارگذاری گزارش...</div>;

  return (
    <>
      <PageHeader title="گزارش‌ها" subtitle={`گزارش عملکرد — ${convertDateAndTimeToJalali(new Date().toISOString())}`} />
      <div className="healan-stats-grid">
        <StatCard label="کل بیماران" value={formatNumber(stats.totalPatients)} icon="👥" />
        <StatCard label="کل پزشکان" value={formatNumber(stats.totalDoctors)} icon="🩺" />
        <StatCard label="نوبت امروز" value={formatNumber(stats.todayAppointments)} icon="📅" />
        <StatCard label="انجام‌شده امروز" value={formatNumber(stats.completedToday)} icon="✅" />
        <StatCard label="درآمد امروز" value={formatCurrency(stats.todayRevenue)} icon="💰" color="#059669" />
        <StatCard label="پرداخت نشده" value={formatNumber(stats.pendingPayments)} icon="⚠️" color="#ef4444" />
        <StatCard label="نسخه امروز" value={formatNumber(stats.todayPrescriptions)} icon="💊" />
        <StatCard label="در انتظار" value={formatNumber(stats.waitingAppointments)} icon="⏳" color="#f59e0b" />
      </div>
    </>
  );
}

export default withAlert(ReportsPage);
