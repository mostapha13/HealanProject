import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import type { AppointmentSummary } from '../../api/types';
import { PageHeader, formatCurrency } from '../../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate, useParams } from '@tse/utils';

function AppointmentDetailPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AppointmentSummary | null>(null);

  useEffect(() => {
    if (!id) return;
    healanApi.appointments.info(+id).then(setData).catch(onAlert);
  }, [id]);

  if (!data) return <div className="healan-empty">در حال بارگذاری...</div>;

  const invoice = data.invoices?.[0];

  return (
    <>
      <PageHeader
        title="جزئیات نوبت"
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate('/appointments')}>بازگشت</button>
        }
      />
      <div className="healan-card">
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div><strong>بیمار:</strong> {data.patientName ?? '—'}</div>
            <div><strong>پزشک:</strong> {data.doctorName ?? '—'}</div>
            <div><strong>تاریخ:</strong> {convertDateAndTimeToJalali(data.appointmentDate)}</div>
            <div><strong>وضعیت:</strong> {data.appointmentTypeName ?? data.appointmentTypeId}</div>
            {invoice && (
              <>
                <div><strong>مبلغ کل:</strong> {formatCurrency(invoice.totalAmount)}</div>
                <div><strong>سهم بیمه:</strong> {formatCurrency(invoice.primaryInsuranceCovered + invoice.secondaryInsuranceCovered)}</div>
                <div><strong>سهم بیمار:</strong> {formatCurrency(invoice.patientPayable)}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AppointmentDetailPage);
