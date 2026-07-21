import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from '@tse/utils';
import { userManager } from '../store/userManager';
import { HealanNavLink } from '../components/HealanNavLink';
import { useUserAccess } from '../context/UserAccessContext';
import { endImpersonation, isImpersonating } from '../api/impersonationApi';
import './healan.scss';

const navItems: Array<{ path: string; label: string; icon: string; end?: boolean; accessPath?: string }> = [
  { path: '/', label: 'داشبورد', end: true, icon: '📊' },
  { path: '/queue', label: 'صف انتظار', icon: '⏳' },
  { path: '/appointments', label: 'پذیرش و نوبت', icon: '📋' },
  { path: '/booking/schedules', label: 'برنامه حضور', icon: '🗓️' },
  { path: '/booking/reservations', label: 'رزروهای نوبت', icon: '📅' },
  { path: '/patients', label: 'بیماران', icon: '👤' },
  { path: '/blood-pressure', label: 'فشار خون', icon: '🩸' },
  { path: '/doctors', label: 'پزشکان', icon: '🩺' },
  { path: '/prescriptions', label: 'نسخه‌ها', icon: '💊' },
  { path: '/basic-data', label: 'اطلاعات پایه', icon: '📁' },
  { path: '/site-content', label: 'محتوای سایت', icon: '🌐' },
  { path: '/reports', label: 'گزارش‌ها', icon: '📈' },
  { path: '/reports/sms', label: 'پیامک‌ها', icon: '💬' },
  { path: '/reports/sms-settings', label: 'تنظیمات پیامک', icon: '⚙️' },
  { path: '/signature', label: 'امضای دیجیتال', icon: '✍️' },
  { path: '/workflow', label: 'کارتابل', icon: '🔄' },
];

export function HealanLayout() {
  const navigate = useNavigate();
  const { canAccess, loading, displayName, currentUser } = useUserAccess();
  const [impersonationActive, setImpersonationActive] = useState(false);
  const [endingImpersonation, setEndingImpersonation] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    void userManager.getUser().then((user) => {
      const active = isImpersonating(user);
      setImpersonationActive(active);
      if (active && user) {
        const delay = Math.max(1000, (user.expires_in - 15) * 1000);
        timer = setTimeout(() => {
          void endImpersonation()
            .catch(() => undefined)
            .finally(() => window.location.assign('/basic-data/users'));
        }, delay);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const userFullName = currentUser
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
    : '';
  const userRole = currentUser?.roleTitle ?? '';

  const visibleNavItems = loading
    ? navItems
    : navItems.filter((item) => canAccess(item.accessPath ?? item.path));

  const handleLogout = async () => {
    if (impersonationActive) {
      await handleEndImpersonation();
      return;
    }
    await userManager.signoutRedirect();
    await userManager.removeUser();
    navigate('/');
  };

  const handleEndImpersonation = async () => {
    setEndingImpersonation(true);
    try {
      await endImpersonation();
    } finally {
      setEndingImpersonation(false);
      window.location.assign('/basic-data/users');
    }
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
            <button
              type="button"
              className="healan-btn healan-btn--outline healan-btn--sm"
              style={{ width: '100%', marginBottom: '0.5rem', borderColor: 'rgba(255,255,255,0.35)', color: '#fff' }}
              onClick={() => navigate('/profile')}
            >
              ویرایش حساب / رمز
            </button>
            <button type="button" className="healan-btn healan-btn--ghost" onClick={handleLogout}>
              خروج از حساب
            </button>
          </div>
        </aside>
        <main className="healan-main">
          {impersonationActive && (
            <div
              role="alert"
              style={{
                marginBottom: '1rem',
                padding: '0.8rem 1rem',
                borderRadius: 10,
                background: '#fff3cd',
                border: '1px solid #f59e0b',
                color: '#7c4a03',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <strong>در حال مشاهده سامانه به‌جای {userFullName || 'کاربر انتخاب‌شده'} هستید.</strong>
              <button
                type="button"
                className="healan-btn healan-btn--danger healan-btn--sm"
                disabled={endingImpersonation}
                onClick={() => void handleEndImpersonation()}
              >
                {endingImpersonation ? 'در حال بازگشت...' : 'بازگشت به حساب مدیر'}
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default HealanLayout;
