import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { PortalMedicationItem } from '../../api/portalApi';
import { usePortalSessionUser } from '../../components/PortalSessionUser';

type Ctx = { todayMeds: PortalMedicationItem[] };

export default function PatientDashboard() {
  const { user } = usePortalSessionUser();
  const { todayMeds } = useOutletContext<Ctx>();

  return (
    <div className="portal-patient__panel">
      <h1 className="portal-patient__title">سلام{user ? `، ${user.displayName}` : ''}</h1>
      <p className="portal-patient__lead">
        از این پنل می‌توانید سوابق، فشار خون و یادآوری دارو را ببینید و نوبت رزرو کنید.
      </p>

      <div className="portal-patient__grid">
        <Link to="/patient/history" className="portal-patient__tile">
          <strong>سوابق</strong>
          <span>نوبت‌ها و ویزیت‌ها</span>
        </Link>
        <Link to="/patient/blood-pressure" className="portal-patient__tile">
          <strong>فشار خون</strong>
          <span>ثبت و پیگیری</span>
        </Link>
        <Link to="/patient/medications" className="portal-patient__tile">
          <strong>داروها</strong>
          <span>یادآوری مصرف</span>
        </Link>
        <Link to="/booking" className="portal-patient__tile">
          <strong>رزرو نوبت</strong>
          <span>انتخاب زمان مراجعه</span>
        </Link>
        <Link to="/assistant" className="portal-patient__tile">
          <strong>چت‌بات</strong>
          <span>سوال از دستیار مطب</span>
        </Link>
      </div>

      <section className="portal-patient__section">
        <h2>یادآوری‌های فعال امروز</h2>
        {todayMeds.length === 0 ? (
          <p className="portal-patient__hint">یادآوری فعالی ثبت نشده است.</p>
        ) : (
          <ul className="portal-patient__list">
            {todayMeds.map((m) => (
              <li key={m.id}>
                <strong>{m.medicationName}</strong>
                {m.dose ? ` · ${m.dose}` : ''}
                <span> · ساعات: {m.timesOfDay}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
