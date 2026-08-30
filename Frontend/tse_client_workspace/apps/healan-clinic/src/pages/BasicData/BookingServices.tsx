import React from 'react';
import withAlert from '../../hoc/withAlert';
import { ServicesPage } from './Services';

function BookingServicesPage({ onAlert }: { onAlert: (message: unknown) => void }) {
  return (
    <ServicesPage
      onAlert={onAlert}
      title="تعریف خدمات زیرمجموعه"
      subtitle="خدمات قابل اتصال به دپارتمان‌های نوبت‌دهی را تعریف، ویرایش، فعال یا غیرفعال کنید."
    />
  );
}

export default withAlert(BookingServicesPage);
