import React from 'react';
import { NavLink, Outlet } from '@tse/utils';
import './healan.scss';

const navItems = [
  { path: '/healan', label: 'داشبورد', end: true, icon: '📊' },
  { path: '/healan/queue', label: 'صف انتظار', icon: '⏳' },
  { path: '/healan/appointments', label: 'پذیرش و نوبت', icon: '📋' },
  { path: '/healan/patients', label: 'بیماران', icon: '👤' },
  { path: '/healan/doctors', label: 'پزشکان', icon: '🩺' },
  { path: '/healan/prescriptions', label: 'نسخه‌ها', icon: '💊' },
];

export function HealanLayout() {
  return (
    <div className="healan-clinic">
      <div className="healan-shell">
        <aside className="healan-sidebar">
          <div className="healan-sidebar__brand">
            <h1>Healan</h1>
            <p>سامانه مدیریت کلینیک و مطب</p>
          </div>
          <nav>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) =>
                  `healan-nav-item${isActive ? ' active' : ''}`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="healan-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default HealanLayout;
