import React from 'react';
import { Outlet } from '@tse/utils';
import { HealanNavLink } from '../../components/HealanNavLink';
import { PageHeader } from '../../components/Ui';
import { useUserAccess } from '../../context/UserAccessContext';

const tabs = [
  { path: '/site-content/settings', label: 'تنظیمات سایت' },
  { path: '/site-content/sections', label: 'بخش‌ها و مطالب' },
  { path: '/site-content/blog', label: 'بلاگ' },
  { path: '/site-content/rag', label: 'ربات پاسخ‌گو' },
  { path: '/site-content/reviews', label: 'نظرات بیماران' },
];

export function SiteContentLayout() {
  const { canAccess, loading } = useUserAccess();
  const visibleTabs = loading ? tabs : tabs.filter((tab) => canAccess(tab.path));

  return (
    <>
      <PageHeader title="محتوای سایت" subtitle="مدیریت مطالب عمومی سایت مطب و نظرات بیماران" />
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

export default SiteContentLayout;
