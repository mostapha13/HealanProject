import React, { useCallback, useEffect, useMemo, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { ClinicAnalytics, DoctorSummary, PatientSummary, ServiceType } from '../../api/types';
import { PageHeader, StatCard, formatCurrency, formatNumber } from '../../components/Ui';
import { JalaliDateInput } from '../../components/JalaliDateInput';
import { SearchableSelect } from '../../components/SearchableSelect';
import { ReportsChart } from '../../components/ReportsChart';
import { formatJalaliDate, todayDateInput } from '../../utils/formatJalali';

function createDefaultFilters() {
  const today = todayDateInput();
  return {
    startDate: today,
    endDate: today,
    doctorId: null as number | null,
    patientId: null as number | null,
    serviceTypeId: null as number | null,
  };
}

function ReportsPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const [filters, setFilters] = useState(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
  const [data, setData] = useState<ClinicAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);

  useEffect(() => {
    Promise.all([
      healanApi.doctors.listAll(),
      healanApi.patients.listAll(),
      healanApi.services.listAll(),
    ])
      .then(([d, p, s]) => {
        setDoctors(d);
        setPatients(p);
        setServices(s);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    healanApi.reports
      .analytics({
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
        doctorId: appliedFilters.doctorId,
        patientId: appliedFilters.patientId,
        serviceTypeId: appliedFilters.serviceTypeId,
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) onAlert(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, onAlert]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const resetToToday = () => {
    const today = createDefaultFilters();
    setFilters(today);
    setAppliedFilters(today);
  };

  const periodLabel = useMemo(() => {
    if (!data) return '';
    const from = formatJalaliDate(data.startDate);
    const to = formatJalaliDate(data.endDate);
    return from === to ? from : `${from} تا ${to}`;
  }, [data]);

  const dateCategories = useCallback(
    (points: { label: string }[]) => points.map((p) => formatJalaliDate(p.label) || p.label),
    []
  );

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        title="گزارش‌ها و نمودارها"
        subtitle={periodLabel ? `بازه گزارش: ${periodLabel}` : 'گزارش عملکرد کلینیک'}
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={resetToToday}>
            امروز
          </button>
        }
      />

      <div className="healan-card healan-reports-filters">
        <div className="healan-card__header">
          <h3>فیلترها</h3>
        </div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>از تاریخ</label>
              <JalaliDateInput
                value={filters.startDate}
                onChange={(startDate) => setFilters((f) => ({ ...f, startDate }))}
                placeholder="از تاریخ"
              />
            </div>
            <div className="healan-form-field">
              <label>تا تاریخ</label>
              <JalaliDateInput
                value={filters.endDate}
                onChange={(endDate) => setFilters((f) => ({ ...f, endDate }))}
                placeholder="تا تاریخ"
              />
            </div>
            <div className="healan-form-field">
              <label>پزشک</label>
              <SearchableSelect
                value={filters.doctorId}
                onChange={(v) => setFilters((f) => ({ ...f, doctorId: v }))}
                placeholder="همه پزشکان"
                options={doctors.map((d) => ({
                  value: d.doctorId,
                  label: `${d.firstName} ${d.lastName}`,
                }))}
              />
            </div>
            <div className="healan-form-field">
              <label>بیمار</label>
              <SearchableSelect
                value={filters.patientId}
                onChange={(v) => setFilters((f) => ({ ...f, patientId: v }))}
                placeholder="همه بیماران"
                options={patients.map((p) => ({
                  value: p.patientId,
                  label: `${p.firstName} ${p.lastName} — ${p.nationalCode}`,
                }))}
              />
            </div>
            <div className="healan-form-field">
              <label>نوع خدمت</label>
              <SearchableSelect
                value={filters.serviceTypeId}
                onChange={(v) => setFilters((f) => ({ ...f, serviceTypeId: v }))}
                placeholder="همه خدمات"
                options={services.map((s) => ({
                  value: s.serviceTypeId,
                  label: s.title,
                }))}
              />
            </div>
          </div>
          <div className="healan-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="healan-btn healan-btn--primary" onClick={applyFilters} disabled={loading}>
              {loading ? 'در حال بارگذاری...' : 'اعمال فیلتر'}
            </button>
            <button
              type="button"
              className="healan-btn healan-btn--outline"
              onClick={() => setFilters(createDefaultFilters())}
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="healan-empty">در حال بارگذاری گزارش...</div>
      ) : summary ? (
        <>
          <div className="healan-stats-grid">
            <StatCard label="کل نوبت‌ها" value={formatNumber(summary.totalAppointments)} icon="📅" />
            <StatCard label="انجام‌شده" value={formatNumber(summary.completedAppointments)} icon="✅" color="#059669" />
            <StatCard label="در انتظار" value={formatNumber(summary.scheduledAppointments)} icon="⏳" color="#f59e0b" />
            <StatCard label="در حال ویزیت" value={formatNumber(summary.inProgressAppointments)} icon="🩺" color="#3b82f6" />
            <StatCard label="درآمد کل" value={formatCurrency(summary.totalRevenue)} icon="💰" color="#059669" />
            <StatCard label="سهم بیمار" value={formatCurrency(summary.patientRevenue)} icon="💳" />
            <StatCard label="سهم بیمه" value={formatCurrency(summary.insuranceRevenue)} icon="🏥" color="#6366f1" />
            <StatCard label="پرداخت نشده" value={formatNumber(summary.pendingPayments)} icon="⚠️" color="#ef4444" />
            <StatCard label="نسخه‌ها" value={formatNumber(summary.prescriptionCount)} icon="💊" />
            <StatCard label="عدم حضور" value={formatNumber(summary.noShowAppointments)} icon="❌" color="#94a3b8" />
          </div>

          <div className="healan-charts-grid">
            <ReportsChart
              type="column"
              title="روند نوبت‌ها"
              categories={dateCategories(data.appointmentsOverTime)}
              series={[{ name: 'تعداد نوبت', data: data.appointmentsOverTime.map((x) => x.count) }]}
            />
            <ReportsChart
              type="pie"
              title="وضعیت نوبت‌ها"
              categories={data.appointmentsByStatus.map((x) => x.name)}
              series={[{ name: 'تعداد', data: data.appointmentsByStatus.map((x) => x.count) }]}
            />
            <ReportsChart
              type="line"
              title="روند درآمد (سهم بیمار)"
              categories={dateCategories(data.revenueOverTime)}
              series={[{ name: 'درآمد (ریال)', data: data.revenueOverTime.map((x) => x.value) }]}
              yAxisTitle="ریال"
            />
            <ReportsChart
              type="pie"
              title="روش پرداخت"
              categories={data.revenueByPaymentMethod.map((x) => x.name)}
              series={[{ name: 'مبلغ', data: data.revenueByPaymentMethod.map((x) => x.value) }]}
            />
            <ReportsChart
              type="bar"
              title="پرکاربردترین خدمات"
              categories={data.topServices.map((x) => x.name)}
              series={[{ name: 'درآمد (ریال)', data: data.topServices.map((x) => x.value) }]}
            />
            <ReportsChart
              type="bar"
              title="نوبت به تفکیک پزشک"
              categories={data.topDoctors.map((x) => x.name)}
              series={[{ name: 'تعداد نوبت', data: data.topDoctors.map((x) => x.count) }]}
            />
            <ReportsChart
              type="column"
              title="روند ثبت نسخه"
              categories={dateCategories(data.prescriptionsOverTime)}
              series={[{ name: 'تعداد نسخه', data: data.prescriptionsOverTime.map((x) => x.count) }]}
            />
            <ReportsChart
              type="pie"
              title="وضعیت فاکتورها"
              categories={data.paymentStatusBreakdown.map((x) => x.name)}
              series={[{ name: 'تعداد', data: data.paymentStatusBreakdown.map((x) => x.count) }]}
            />
          </div>
        </>
      ) : (
        <div className="healan-empty">گزارشی یافت نشد</div>
      )}
    </>
  );
}

export default withAlert(ReportsPage);
