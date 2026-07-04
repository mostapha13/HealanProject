import React from 'react';
import { Outlet } from '@tse/utils';
import { HealanNavLink } from '../../components/HealanNavLink';
import { PageHeader } from '../../components/Ui';

const tabs = [
  { path: '/basic-data/companies', label: 'مرکز درمانی' },
  { path: '/basic-data/insurance', label: 'بیمه' },
  { path: '/basic-data/services', label: 'خدمات' },
  { path: '/basic-data/fees', label: 'تعرفه' },
  { path: '/basic-data/users', label: 'کاربران' },
];

export function BasicDataLayout() {
  return (
    <>
      <PageHeader title="اطلاعات پایه" subtitle="مدیریت داده‌های مرجع سیستم" />
      <div className="healan-tabs">
        {tabs.map((t) => (
          <HealanNavLink key={t.path} to={t.path} className={({ isActive }: { isActive: boolean }) => `healan-tab${isActive ? ' active' : ''}`}>
            {t.label}
          </HealanNavLink>
        ))}
      </div>
      <Outlet />
    </>
  );
}

export default BasicDataLayout;
