import React from 'react';
import { Outlet } from '@tse/utils';
import HealanNavLink from '../../components/HealanNavLink';

export function SiteContentLayout() {
  const links = [
    ['/site-content/sections', 'محتوای سایت'],
    ['/site-content/varicose-cases', 'نمونه‌کارهای واریس'],
    ['/site-content/contact-messages', 'پیام‌های تماس'],
  ];
  return <>
    <nav className="healan-card" aria-label="مدیریت محتوای سایت" style={{ marginBottom: 16 }}>
      <div className="healan-card__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {links.map(([to, label]) => <HealanNavLink key={to} to={to} className={({ isActive }) => `healan-btn ${isActive ? 'healan-btn--primary' : 'healan-btn--outline'}`}>{label}</HealanNavLink>)}
      </div>
    </nav>
    <Outlet />
  </>;
}

export default SiteContentLayout;
