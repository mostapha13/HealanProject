import React from 'react';
import { Outlet, useNavigate } from '@tse/utils';
import { userManager } from '../store/userManager';
import { HealanNavLink } from '../components/HealanNavLink';
import { useUserAccess } from '../context/UserAccessContext';
import './healan.scss';

const navItems = [
  { path: '/', label: 'داشبورد', end: true, icon: '📊' },
  { path: '/queue', label: 'صف انتظار', icon: '⏳' },
  { path: '/appointments', label: 'پذیرش و نوبت', icon: '📋' },
  { path: '/patients', label: 'بیماران', icon: '👤' },
  { path: '/doctors', label: 'پزشکان', icon: '🩺' },
  { path: '/prescriptions', label: 'نسخه‌ها', icon: '💊' },
  { path: '/basic-data', label: 'اطلاعات پایه', icon: '📁' },
  { path: '/reports', label: 'گزارش‌ها', icon: '📈' },
  { path: '/signature', label: 'امضای دیجیتال', icon: '✍️' },
  { path: '/workflow', label: 'کارتابل', icon: '🔄' },
];

export function HealanLayout() {
  const navigate = useNavigate();
  const { canAccess, loading, displayName, currentUser } = useUserAccess();

  const userFullName = currentUser
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
    : '';
  const userRole = currentUser?.roleTitle ?? '';

  const visibleNavItems = loading
    ? navItems
    : navItems.filter((item) => canAccess(item.path));

  const handleLogout = async () => {
    await userManager.signoutRedirect();
    await userManager.removeUser();
    navigate('/');
  };

  return (
    <div className="healan-clinic">
      <div className="healan-shell">
        <aside className="healan-sidebar">
          <div className="healan-sidebar__brand">
            <h1>Healan</h1>
            <p>سامانه مدیریت کلینیک و مطب</p>
          </div>
          <nav>
            {visibleNavItems.map((item) => (
              <HealanNavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) =>
                  `healan-nav-item${isActive ? ' active' : ''}`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </HealanNavLink>
            ))}
          </nav>
          <div className="healan-sidebar__footer">
            <div className="healan-sidebar__user">
              <span className="healan-sidebar__user-icon" aria-hidden="true">👤</span>
              <div className="healan-sidebar__user-text">
                <span className="healan-sidebar__user-label">کاربر فعال</span>
                <strong>
                  {loading ? 'در حال بارگذاری...' : userFullName || displayName || '—'}
                </strong>
                {!loading && userRole && (
                  <span className="healan-sidebar__user-meta">{userRole}</span>
                )}
              </div>
            </div>
            <button type="button" className="healan-btn healan-btn--ghost" onClick={handleLogout}>
              خروج از حساب
            </button>
          </div>
        </aside>
        <main className="healan-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default HealanLayout;
