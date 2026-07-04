import React, { useEffect, useState } from 'react';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import healanApi from 'apps/cash-market/src/Controller/Healan/api';
import { PageHeader, formatCurrency } from '../components/Ui';
import { convertDateAndTimeToJalali } from '@tse/tools';
import { useNavigate, useParams } from '@tse/utils';

function AppointmentDetailPage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    healanApi.appointments.info(+id)
      .then(setData)
      .catch(onAlert);
  }, [id]);

  if (!data) return <div className="healan-empty">در حال بارگذاری...</div>;

  const invoice = (data.invoices as Record<string, unknown>[] | undefined)?.[0];

  return (
    <>
      <PageHeader
        title="جزئیات نوبت"
        action={
          <button type="button" className="healan-btn healan-btn--outline" onClick={() => navigate('/healan/appointments')}>
            بازگشت
          </button>
        }
      />
      <div className="healan-card">
        <div className="healan-card__body">
          <div className="healan-form-grid">
            <div><strong>بیمار:</strong> {String(data.patientName ?? '—')}</div>
            <div><strong>پزشک:</strong> {String(data.doctorName ?? '—')}</div>
            <div><strong>تاریخ:</strong> {convertDateAndTimeToJalali(String(data.appointmentDate))}</div>
            <div><strong>وضعیت:</strong> {String(data.appointmentTypeName ?? data.appointmentTypeId)}</div>
            {invoice && (
              <>
                <div><strong>مبلغ کل:</strong> {formatCurrency(Number(invoice.totalAmount))}</div>
                <div><strong>سهم بیمه:</strong> {formatCurrency(Number(invoice.primaryInsuranceCovered) + Number(invoice.secondaryInsuranceCovered))}</div>
                <div><strong>سهم بیمار:</strong> {formatCurrency(Number(invoice.patientPayable))}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AppointmentDetailPage);
