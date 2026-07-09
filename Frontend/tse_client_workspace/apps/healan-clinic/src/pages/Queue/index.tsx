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
import { appointmentDoctorName, appointmentInsuranceDisplay, appointmentPatientDisplay, appointmentPatientName, appointmentPaymentColor, appointmentPaymentLabel, appointmentIsScheduled, appointmentIsDuringVisit, appointmentCanRecordClinicalWork } from '../../utils/appointmentDisplay';
import { useNavigate } from '@tse/utils';
import { openEchoPrintWindowBlank, writeEchoPrintHtmlToWindow } from '../../utils/printEchoReport';
import { buildEchoPrintPayload } from '../../utils/echoPrintPayload';
import { PatientVisitHistoryDrawer } from '../../components/PatientVisitHistoryDrawer';

function QueuePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppointmentSummary[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyPatient, setHistoryPatient] = useState<{ patientId: number; patientName: string } | null>(null);

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

  const goToPrescription = async (item: AppointmentSummary) => {
    try {
      if (appointmentIsScheduled(item.appointmentTypeId as AppointmentStatus)) {
        await healanApi.appointments.changeStatus({
          appointmentId: item.appointmentId,
          appointmentTypeId: 'InProgress',
        });
        await load();
      }
      navigate(`/prescriptions?appointmentId=${item.appointmentId}`);
    } catch (err) {
      onAlert(err);
    }
  };

  const printEcho = async (prescriptionId: number) => {
    try {
      const w = openEchoPrintWindowBlank();
      if (!w) {
        onAlert({ type: 'error', message: 'پنجره چاپ باز نشد (Popup blocker). اجازه پنجره‌های جدید را فعال کن.' });
        return;
      }
      const data = await healanApi.prescriptions.echoPrintData(prescriptionId);
      writeEchoPrintHtmlToWindow(w, buildEchoPrintPayload(data));
    } catch (err) {
      onAlert(err);
    }
  };

  return (
    <>
      <PageHeader
        title="صف انتظار"
        subtitle="شروع ویزیت و ثبت نسخه بدون نیاز به پرداخت — تسویه قبل یا بعد از ویزیت"
      />

      <div className="healan-search-bar">
        <input
          placeholder="جستجو بر اساس نام، نام خانوادگی یا کد ملی..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {historyPatient && (
        <PatientVisitHistoryDrawer
          patientId={historyPatient.patientId}
          patientName={historyPatient.patientName}
          onAlert={onAlert}
          onClose={() => setHistoryPatient(null)}
        />
      )}

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
                    {appointmentIsScheduled(status) && (
                      <>
                        <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'InProgress')}>
                          شروع ویزیت
                        </button>
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => void goToPrescription(item)}>
                          شروع و ثبت نسخه
                        </button>
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => navigate(`/appointments/${item.appointmentId}`)}>
                          پرداخت / پرونده
                        </button>
                        <button type="button" className="healan-btn healan-btn--outline healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'NoShow')}>
                          عدم حضور
                        </button>
                      </>
                    )}
                    {appointmentIsDuringVisit(status) && (
                      <>
                        <button type="button" className="healan-btn healan-btn--primary healan-btn--sm" onClick={() => changeStatus(item.appointmentId, 'Completed')}>
                          پایان ویزیت
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => navigate(`/prescriptions?appointmentId=${item.appointmentId}`)}
                        >
                          ثبت نسخه
                        </button>
                        <button
                          type="button"
                          className="healan-btn healan-btn--outline healan-btn--sm"
                          onClick={() => navigate(`/appointments?edit=${item.appointmentId}`)}
                        >
                          افزودن خدمت
                        </button>
                      </>
                    )}
                    {appointmentCanRecordClinicalWork(status) && item.prescriptionId ? (
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        onClick={() => navigate(`/prescriptions?prescriptionId=${item.prescriptionId}`)}
                      >
                        ویرایش نسخه
                      </button>
                    ) : null}
                    {item.hasEchoReport && item.prescriptionId ? (
                      <button
                        type="button"
                        className="healan-btn healan-btn--primary healan-btn--sm"
                        onClick={() => void printEcho(item.prescriptionId!)}
                      >
                        چاپ اکو
                      </button>
                    ) : null}
                    {item.patientHasVisitHistory && item.patientId > 0 ? (
                      <button
                        type="button"
                        className="healan-btn healan-btn--outline healan-btn--sm"
                        onClick={() =>
                          setHistoryPatient({
                            patientId: item.patientId,
                            patientName: appointmentPatientName(item),
                          })
                        }
                      >
                        سوابق
                      </button>
                    ) : null}
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
