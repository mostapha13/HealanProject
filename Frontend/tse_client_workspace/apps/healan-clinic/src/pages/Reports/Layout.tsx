import React from 'react';
import { Outlet } from '@tse/utils';
import { HealanNavLink } from '../../components/HealanNavLink';

const tabs = [
  { path: '/reports', label: 'نمودارها و آمار', end: true },
  { path: '/reports/sms', label: 'پیامک‌های ارسالی' },
  { path: '/reports/sms-settings', label: 'تنظیمات پیامک' },
];

export function ReportsLayout() {
  return (
    <>
      <div className="healan-tabs" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <HealanNavLink
            key={t.path}
            to={t.path}
            end={t.end}
            className={({ isActive }: { isActive: boolean }) => `healan-tab${isActive ? ' active' : ''}`}
          >
            {t.label}
          </HealanNavLink>
        ))}
      </div>
      <Outlet />
    </>
  );
}

export default ReportsLayout;
