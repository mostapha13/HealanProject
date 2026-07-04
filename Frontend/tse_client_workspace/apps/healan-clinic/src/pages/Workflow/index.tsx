import React from 'react';
import { PageHeader } from '../../components/Ui';

/** کارتابل Workflow — سرویس آماده، UI فعلاً غیرفعال طبق نیازمندی */
function WorkflowPage() {
  return (
    <>
      <PageHeader title="کارتابل / Workflow" subtitle="سرویس فرایند آماده است — استفاده UI در فاز بعد" />
      <div className="healan-card">
        <div className="healan-card__body">
          <p>سرویس WorkFlow برای مدیریت فرایندهای تأیید و کارتابل کاربران پیکربندی شده است.</p>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            API: <code>Cardboard/UserCardboard/Fa</code> — فعلاً در UI کلینیک فعال نشده و در اسپرینت‌های بعدی قابل اتصال است.
          </p>
        </div>
      </div>
    </>
  );
}

export default WorkflowPage;
