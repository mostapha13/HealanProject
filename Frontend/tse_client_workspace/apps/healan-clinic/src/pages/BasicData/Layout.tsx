import React from 'react';
import { Outlet } from '@tse/utils';
import { HealanNavLink } from '../../components/HealanNavLink';
import { PageHeader } from '../../components/Ui';
import { useUserAccess } from '../../context/UserAccessContext';

const tabs = [
  { path: '/basic-data/companies', label: 'مرکز درمانی' },
  { path: '/basic-data/insurance', label: 'بیمه' },
  { path: '/basic-data/services', label: 'خدمات' },
  { path: '/basic-data/fees', label: 'تعرفه' },
  { path: '/basic-data/users', label: 'کاربران' },
  { path: '/basic-data/access', label: 'تعریف دسترسی' },
  { path: '/basic-data/access-roles', label: 'سطح دسترسی' },
];

export function BasicDataLayout() {
  const { canAccess, loading } = useUserAccess();
  const visibleTabs = loading ? tabs : tabs.filter((tab) => canAccess(tab.path));

  return (
    <>
      <PageHeader title="اطلاعات پایه" subtitle="مدیریت داده‌های مرجع سیستم" />
      <div className="healan-tabs">
        {visibleTabs.map((t) => (
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
