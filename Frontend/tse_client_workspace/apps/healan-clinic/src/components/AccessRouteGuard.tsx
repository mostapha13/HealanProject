import React from 'react';
import { Navigate, useLocation } from '@tse/utils';
import { useUserAccess } from '../context/UserAccessContext';

interface AccessRouteGuardProps {
  path: string;
  children: React.ReactNode;
}

/** جلوگیری از دسترسی مستقیم به مسیرهای بدون مجوز */
export function AccessRouteGuard({ path, children }: AccessRouteGuardProps) {
  const { loading, canAccess } = useUserAccess();
  const location = useLocation();

  if (loading) {
    return (
      <div className="healan-empty" style={{ minHeight: '40vh' }}>
        <p>در حال بارگذاری دسترسی‌ها...</p>
      </div>
    );
  }

  if (!canAccess(path)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default AccessRouteGuard;
