import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingProfileStatus,
  getPortalRagToken,
  setPortalRagToken,
} from '../api/portalApi';

export type PortalSessionUser = {
  displayName: string;
  phoneMasked?: string;
};

function buildDisplayName(status: {
  firstName?: string;
  lastName?: string;
  phoneMasked?: string;
  phoneNumber?: string;
}): string {
  const full = [status.firstName, status.lastName]
    .map((x) => (x || '').trim())
    .filter(Boolean)
    .join(' ');
  if (full) return full;
  if (status.phoneMasked?.trim()) return status.phoneMasked.trim();
  if (status.phoneNumber?.trim()) return status.phoneNumber.trim();
  return 'کاربر';
}

/** بارگذاری / پاک‌سازی نشست بیمار روی سایت عمومی. */
export function usePortalSessionUser() {
  const [user, setUser] = useState<PortalSessionUser | null>(null);

  const refresh = useCallback(async () => {
    if (!getPortalRagToken()) {
      setUser(null);
      return;
    }
    try {
      const status = await bookingProfileStatus();
      if (status?.isAuthenticated) {
        setUser({
          displayName: buildDisplayName(status),
          phoneMasked: status.phoneMasked,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    setPortalRagToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, refresh, logout };
}

type PortalSessionActionsProps = {
  user: PortalSessionUser;
  onLogout: () => void;
  /** برای منوی موبایل دکمه‌ها بزرگ‌تر باشند */
  stacked?: boolean;
};

/** نام کاربر لاگین‌شده + لینک پنل بیمار + دکمه خروج — گوشه هدر سایت عمومی. */
export function PortalSessionActions({ user, onLogout, stacked }: PortalSessionActionsProps) {
  return (
    <div className={`portal-header__user${stacked ? ' is-stacked' : ''}`}>
      <span className="portal-header__user-name" title={user.phoneMasked || user.displayName}>
        {user.displayName}
      </span>
      <Link to="/patient" className={`p-btn p-btn--outline${stacked ? '' : ' p-btn--sm'}`}>
        پنل بیمار
      </Link>
      <button
        type="button"
        className={`p-btn p-btn--outline${stacked ? '' : ' p-btn--sm'}`}
        onClick={onLogout}
      >
        خروج
      </button>
    </div>
  );
}
