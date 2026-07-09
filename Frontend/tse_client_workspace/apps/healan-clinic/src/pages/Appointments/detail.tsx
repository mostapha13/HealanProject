import React, { useCallback, useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { AppointmentStatus, AppointmentSummary } from '../../api/types';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '../../api/types';
import { PageHeader, StatusBadge, formatCurrency } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate, useParams } from '@tse/utils';
import {
  appointmentDoctorName,
  appointmentInsuranceDisplay,
  appointmentInvoice,
  appointmentPendingInvoice,
  appointmentHasPaidInvoice,
  appointmentPatientDisplay,
  appointmentPatientNationalCode,
  appointmentPaymentColor,
  appointmentPaymentLabel,
  appointmentServiceTitles,
  appointmentIsScheduled,
  appointmentIsDuringVisit,
  appointmentCanRecordClinicalWork,
  invoiceItemServiceTitle,
} from '../../utils/appointmentDisplay';
import { openEchoPrintWindow } from '../../utils/printEchoReport';
import { buildEchoPrintPayload } from '../../utils/echoPrintPayload';
import { PatientVisitHistoryDrawer } from '../../components/PatientVisitHistoryDrawer';

function AppointmentDetailPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AppointmentSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentMethods, setPaymentMethods] = useState<{ paymentMethodTypeId: string; paymentMethodTypeName?: string }[]>([]);
  const [paying, setPaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const reload = useCallback(() => {
    if (!id) return Promise.resolve();
    return healanApi.appointments.info(+id).then(setData).catch(onAlert);
  }, [id, onAlert]);

  useEffect(() => {
    void reload();
    healanApi.appointments.paymentMethods().then((items) => {
      const list = Array.isArray(items) ? items : [];
      setPaymentMethods(list as { paymentMethodTypeId: string; paymentMethodTypeName?: string }[]);
    }).catch(() => {});
  }, [reload]);

  const handlePay = async () => {
    const invoice = appointmentInvoice(data!);
    if (!invoice) return;
    setPaying(true);
    try {
      await healanApi.appointments.pay({
        invoiceId: invoice.invoiceId,
        paymentReference: `PAY-${Date.now()}`,
        paymentMethodTypeId: paymentMethod,
      });
      await reload();
    } catch (err) {
      onAlert(err);
    } finally {
      setPaying(false);
    }
  };

  const changeStatus = async (status: AppointmentStatus) => {
    if (!data) return;
    try {
      await healanApi.appointments.changeStatus({ appointmentId: data.appointmentId, appointmentTypeId: status });
      await reload();
    } catch (err) {
      onAlert(err);
    }
  };

  const goToPrescription = async () => {
    if (!data) return;
    try {
      if (appointmentIsScheduled(data.appointmentTypeId as AppointmentStatus)) {
        await healanApi.appointments.changeStatus({
          appointmentId: data.appointmentId,
          appointmentTypeId: 'InProgress',
        });
      }
      navigate(`/prescriptions?appointmentId=${data.appointmentId}`);
    } catch (err) {
      onAlert(err);
    }
  };

  const printEcho = async () => {
    if (!data?.prescriptionId) return;
    try {
      const printData = await healanApi.prescriptions.echoPrintData(data.prescriptionId);
      openEchoPrintWindow(buildEchoPrintPayload(printData));
    } catch (err) {
      onAlert(err);
    }
  };

  if (!data) return <div className="healan-empty">در حال بارگذاری...</div>;

  const invoice = appointmentInvoice(data);
  const pendingInvoice = appointmentPendingInvoice(data);
  const status = data.appointmentTypeId as AppointmentStatus;
  const hasPaidInvoice = appointmentHasPaidInvoice(data);
  const canStartVisit = appointmentIsScheduled(status);
  const canComplete = appointmentIsDuringVisit(status);
  const canRecordClinical = appointmentCanRecordClinicalWork(status) || appointmentIsScheduled(status);
  const paymentSettled = !pendingInvoice && hasPaidInvoice;
  const visitStarted = appointmentIsDuringVisit(status) || status === 'Completed';

  return (
    <>
      <PageHeader
        title="پرونده ویزیت"
        subtitle="ویزیت، ثبت نسخه و پرداخت — پرداخت می‌تواند قبل یا بعد از ویزیت انجام شود"
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate('/appointments')}>
            بازگشت
          </button>
        }
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <h3>وضعیت فرایند</h3>
          <StatusBadge label={APPOINTMENT_STATUS_LABELS[status] ?? status} color={APPOINTMENT_STATUS_COLORS[status] ?? '#6b7280'} />
          <StatusBadge label={appointmentPaymentLabel(data)} color={appointmentPaymentColor(data)} />
        </div>
        <div className="healan-card__body">
          <ol className="healan-workflow-steps">
            <li className="done">۱. ثبت نوبت و خدمات توسط منشی</li>
            <li className={visitStarted ? 'done' : canStartVisit ? 'active' : ''}>
              ۲. ویزیت توسط پزشک (شروع ویزیت)
            </li>
            <li className={status === 'Completed' ? 'done' : appointmentIsDuringVisit(status) ? 'active' : ''}>
              ۳. ثبت نسخه و افزودن خدمات حین ویزیت
            </li>
            <li className={paymentSettled ? 'done' : pendingInvoice || invoice ? 'active' : ''}>
              ۴. پرداخت (قبل یا بعد از ویزیت)
            </li>
          </ol>
          <p className="healan-workflow-hint">
            پزشک می‌تواند بدون پرداخت، ویزیت را شروع کند و حین ویزیت نسخه و خدمات (مثل اکو) را ثبت کند.
            مبلغ نهایی پس از ویزیت محاسبه و توسط منشی دریافت می‌شود — یا در صورت چکاپ، از ابتدا پرداخت شود.
          </p>
        </div>
      </div>

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__header"><h3>اطلاعات بیمار و نوبت</h3></div>
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div><strong>بیمار:</strong> {appointmentPatientDisplay(data)}</div>
            <div><strong>کد ملی:</strong> {appointmentPatientNationalCode(data)}</div>
            <div><strong>پزشک:</strong> {appointmentDoctorName(data)}</div>
            <div><strong>بیمه:</strong> {appointmentInsuranceDisplay(data)}</div>
            <div><strong>تاریخ:</strong> <span>{convertDateAndTimeToJalali(data.appointmentDate)}</span></div>
            <div><strong>خدمات:</strong> {appointmentServiceTitles(data)}</div>
          </div>
        </div>
      </div>

      {invoice && (
        <div className="healan-card" style={{ marginBottom: '1rem' }}>
          <div className="healan-card__header">
            <h3>{pendingInvoice && appointmentHasPaidInvoice(data) ? 'فاکتور مکمل (خدمات اضافه‌شده)' : 'فاکتور و پرداخت'}</h3>
          </div>
          <div className="healan-card__body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="healan-table">
              <thead>
                <tr>
                  <th>خدمت</th>
                  <th>مبلغ</th>
                  <th>سهم بیمار</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.invoiceItems ?? []).length > 0 ? (
                  invoice.invoiceItems!.map((item) => (
                    <tr key={item.invoiceItemId ?? item.serviceType?.serviceTypeId}>
                      <td>{invoiceItemServiceTitle(item, data)}</td>
                      <td>{formatCurrency(item.amount ?? item.unitPrice ?? 0)}</td>
                      <td>{formatCurrency(item.patientPayable ?? 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>{appointmentServiceTitles(data)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--healan-border)' }}>
              <div className="healan-form-grid">
                <div><strong>مبلغ کل:</strong> {formatCurrency(invoice.totalAmount)}</div>
                <div><strong>سهم بیمه:</strong> {formatCurrency(invoice.primaryInsuranceCovered + invoice.secondaryInsuranceCovered)}</div>
                <div><strong>قابل پرداخت:</strong> {formatCurrency(invoice.patientPayable)}</div>
              </div>
              {!pendingInvoice && appointmentHasPaidInvoice(data) && (
                <p style={{ marginTop: '1rem', color: '#047857', fontSize: '0.85rem' }}>
                  فاکتور اصلی پرداخت شده است.
                </p>
              )}
              {pendingInvoice && (
                <div className="healan-actions" style={{ marginTop: '1rem', alignItems: 'flex-end' }}>
                  <div className="healan-form-field" style={{ minWidth: '12rem' }}>
                    <label>روش پرداخت</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((m) => (
                          <option key={m.paymentMethodTypeId} value={m.paymentMethodTypeId}>
                            {m.paymentMethodTypeName ?? m.paymentMethodTypeId}
                          </option>
                        ))
                      ) : (
                        <option value="Cash">نقدی</option>
                      )}
                    </select>
                  </div>
                  <button type="button" className="healan-btn healan-btn--primary" disabled={paying} onClick={handlePay}>
                    {paying ? 'در حال ثبت...' : 'ثبت پرداخت'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="healan-card">
        <div className="healan-card__header"><h3>عملیات ویزیت</h3></div>
        <div className="healan-card__body">
          <div className="healan-actions" style={{ flexWrap: 'wrap' }}>
            {canStartVisit && (
              <button type="button" className="healan-btn healan-btn--primary" onClick={() => changeStatus('InProgress')}>
                شروع ویزیت
              </button>
            )}
            {canComplete && (
              <button type="button" className="healan-btn healan-btn--primary" onClick={() => changeStatus('Completed')}>
                پایان ویزیت
              </button>
            )}
            {canRecordClinical && (
              <button
                type="button"
                className="healan-btn healan-btn--primary"
                onClick={() => void goToPrescription()}
              >
                {appointmentIsScheduled(status) ? 'شروع ویزیت و ثبت نسخه' : 'ثبت / ویرایش نسخه'}
              </button>
            )}
            {canRecordClinical && (
              <button
                type="button"
                className="healan-btn healan-btn--outline"
                onClick={() => navigate(`/appointments?edit=${data.appointmentId}`)}
              >
                افزودن خدمت حین ویزیت
              </button>
            )}
            {data.hasEchoReport && data.prescriptionId ? (
              <button type="button" className="healan-btn healan-btn--primary" onClick={() => void printEcho()}>
                چاپ اکو
              </button>
            ) : null}
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => setShowHistory(true)}>
              سوابق بیمار
            </button>
            {!canRecordClinical && (
              <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate(`/appointments?edit=${data.appointmentId}`)}>
                ویرایش نوبت / افزودن خدمت
              </button>
            )}
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate('/queue')}>
              صف انتظار
            </button>
          </div>
          {pendingInvoice && appointmentIsDuringVisit(status) && (
            <p style={{ marginTop: '1rem', color: '#b45309', fontSize: '0.85rem' }}>
              ویزیت در حال انجام است — پس از اتمام، مبلغ نهایی (شامل خدمات اضافه‌شده) توسط منشی دریافت می‌شود.
            </p>
          )}
          {pendingInvoice && appointmentIsScheduled(status) && (
            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
              پرداخت هنوز انجام نشده — می‌توانید ابتدا ویزیت را شروع کنید یا در صورت چکاپ، همین حالا پرداخت را ثبت کنید.
            </p>
          )}
          {paymentSettled && (
            <p style={{ marginTop: '1rem', color: '#047857', fontSize: '0.85rem' }}>
              پرداخت انجام شده است.
            </p>
          )}
        </div>
      </div>

      {showHistory && (
        <PatientVisitHistoryDrawer
          patientId={data.patientId}
          patientName={appointmentPatientDisplay(data)}
          onAlert={onAlert}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}

export default withAlert(AppointmentDetailPage);
