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
  appointmentCanStartVisit,
  appointmentPendingInvoice,
  appointmentHasPaidInvoice,
  appointmentPatientDisplay,
  appointmentPatientNationalCode,
  appointmentPaymentColor,
  appointmentPaymentLabel,
  appointmentServiceTitles,
  invoiceItemServiceTitle,
} from '../../utils/appointmentDisplay';

function AppointmentDetailPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AppointmentSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentMethods, setPaymentMethods] = useState<{ paymentMethodTypeId: string; paymentMethodTypeName?: string }[]>([]);
  const [paying, setPaying] = useState(false);

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

  if (!data) return <div className="healan-empty">در حال بارگذاری...</div>;

  const invoice = appointmentInvoice(data);
  const pendingInvoice = appointmentPendingInvoice(data);
  const status = data.appointmentTypeId as AppointmentStatus;
  const hasPaidInvoice = appointmentHasPaidInvoice(data);
  const canStartVisit = appointmentCanStartVisit(data) && (status === 'Scheduled' || status === 'ReScheduled');
  const canComplete = status === 'InProgress';

  return (
    <>
      <PageHeader
        title="پرونده ویزیت"
        subtitle="مراحل پذیرش، پرداخت و ویزیت پزشک"
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
            <li className={hasPaidInvoice ? 'done' : 'active'}>۱. ثبت نوبت و خدمات توسط منشی</li>
            <li className={hasPaidInvoice ? 'done' : ''}>۲. پرداخت هزینه توسط بیمار</li>
            <li className={status === 'InProgress' || status === 'Completed' ? 'done' : hasPaidInvoice ? 'active' : ''}>۳. شروع ویزیت توسط پزشک</li>
            <li className={status === 'Completed' ? 'done' : ''}>۴. ثبت نسخه (دارو / آزمایش / تصویربرداری)</li>
          </ol>
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
            {(status === 'InProgress' || status === 'Completed') && (
              <button
                type="button"
                className="healan-btn healan-btn--outline"
                onClick={() => navigate(`/prescriptions?appointmentId=${data.appointmentId}`)}
              >
                ثبت / ویرایش نسخه
              </button>
            )}
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate(`/appointments?edit=${data.appointmentId}`)}>
              ویرایش نوبت / افزودن خدمت
            </button>
            <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate('/queue')}>
              صف انتظار
            </button>
          </div>
          {!canStartVisit && status === 'Scheduled' && (
            <p style={{ marginTop: '1rem', color: '#b45309', fontSize: '0.85rem' }}>
              برای شروع ویزیت، ابتدا بیمار باید هزینه خدمات را پرداخت کند.
            </p>
          )}
          {canStartVisit && status === 'Scheduled' && (
            <p style={{ marginTop: '1rem', color: '#047857', fontSize: '0.85rem' }}>
              پرداخت انجام شده — پزشک می‌تواند ویزیت را شروع کند.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default withAlert(AppointmentDetailPage);
