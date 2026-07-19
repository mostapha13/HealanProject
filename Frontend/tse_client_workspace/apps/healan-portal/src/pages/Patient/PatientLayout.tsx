import React, { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  bookingProfileStatus,
  getPortalRagToken,
  patientMedicationList,
  type PortalMedicationItem,
} from '../../api/portalApi';
import { PortalAuthModal, resolvePatientEntry, type PortalAuthModalMode } from '../../components/PortalAuthModal';
import { PortalSessionActions, usePortalSessionUser } from '../../components/PortalSessionUser';

const NAV = [
  { to: '/patient', end: true, label: 'داشبورد' },
  { to: '/patient/history', label: 'سوابق' },
  { to: '/patient/blood-pressure', label: 'فشار خون' },
  { to: '/patient/medications', label: 'یادآوری دارو' },
  { to: '/assistant', label: 'چت‌بات' },
  { to: '/booking', label: 'رزرو نوبت' },
] as const;

export default function PatientLayout() {
  const navigate = useNavigate();
  const { user, refresh, logout } = usePortalSessionUser();
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<PortalAuthModalMode>('register');
  const [todayMeds, setTodayMeds] = useState<PortalMedicationItem[]>([]);

  const gate = useCallback(async () => {
    if (!getPortalRagToken()) {
      setAuthMode('register');
      setAuthOpen(true);
      setReady(false);
      return;
    }
    try {
      const entry = await resolvePatientEntry();
      if (entry.action === 'goto-patient') {
        setAuthOpen(false);
        setReady(true);
        await refresh();
        try {
          const meds = await patientMedicationList();
          setTodayMeds((Array.isArray(meds) ? meds : []).filter((m) => m.isActive));
        } catch {
          setTodayMeds([]);
        }
        return;
      }
      setAuthMode(entry.mode);
      setAuthOpen(true);
      setReady(false);
    } catch {
      setAuthMode('register');
      setAuthOpen(true);
      setReady(false);
    }
  }, [refresh]);

  useEffect(() => {
    void gate();
  }, [gate]);

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="portal-patient">
      <header className="portal-patient__top">
        <div className="portal-patient__top-inner">
          <Link to="/" className="portal-patient__brand">
            ناحیه بیمار
            <span className="portal-patient__build">build-v14-patient</span>
          </Link>
          <div className="portal-patient__top-actions">
            {user ? (
              <PortalSessionActions user={user} onLogout={onLogout} />
            ) : (
              <button type="button" className="p-btn p-btn--primary p-btn--sm" onClick={() => setAuthOpen(true)}>
                ورود
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="portal-patient__body">
        <aside className="portal-patient__nav" aria-label="منوی بیمار">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                `portal-patient__nav-link${isActive ? ' is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="portal-patient__main">
          {ready ? (
            <Outlet context={{ todayMeds, refreshMeds: gate }} />
          ) : (
            <p className="portal-patient__hint">برای ورود به ناحیه بیمار، شماره موبایل را تأیید کنید.</p>
          )}
        </main>
      </div>

      <PortalAuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => {
          setAuthOpen(false);
          if (!getPortalRagToken()) navigate('/');
        }}
        onSuccess={async () => {
          setAuthOpen(false);
          const status = await bookingProfileStatus().catch(() => null);
          if (status?.isPatient) {
            await gate();
            navigate('/patient');
          } else {
            setAuthMode('complete');
            setAuthOpen(true);
          }
        }}
      />
    </div>
  );
}
