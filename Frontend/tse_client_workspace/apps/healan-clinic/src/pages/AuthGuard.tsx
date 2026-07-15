import React, { useEffect, useState } from 'react';
import { userManager } from '../store/userManager';
import { UserAccessProvider } from '../context/UserAccessContext';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

interface AuthGuardProps {
  children: React.ReactNode;
}

/** بررسی احراز هویت OIDC قبل از نمایش اپ */
export function AuthGuard({ children }: AuthGuardProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const authHint = params.get('auth');

        const user = await userManager.getUser();
        if (user && !user.expired && user.access_token) {
          setClinicBearerToken(user.access_token);
          if (!cancelled) setReady(true);
          return;
        }

        if (authHint === 'callback_error' || authHint === 'missing_token') {
          if (!cancelled) {
            setError(
              'تکمیل ورود ناموفق بود. یک‌بار صفحه را کامل ببندید و دوباره از clinic وارد شوید.'
            );
          }
          return;
        }

        const last = Number(sessionStorage.getItem('healan_auth_redirect_at') || '0');
        if (Date.now() - last < 30_000) {
          if (!cancelled) {
            setError('ورود در حلقه افتاده است. تب را ببندید و دوباره باز کنید.');
          }
          return;
        }

        sessionStorage.setItem('healan_auth_redirect_at', String(Date.now()));
        await userManager.signinRedirect();
      } catch {
        if (!cancelled) {
          setError(
            'اتصال به سرویس ورود برقرار نشد. لطفاً چند دقیقه بعد دوباره تلاش کنید یا مستقیماً به auth.drshahrooei.ir بروید.'
          );
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="healan-auth-screen">
        <div className="healan-auth-card">
          <h1>Healan</h1>
          <p>{error}</p>
          <p>
            <a href="http://auth.drshahrooei.ir/">رفتن به صفحه ورود</a>
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="healan-auth-screen">
        <div className="healan-auth-card">
          <h1>Healan</h1>
          <p>در حال انتقال به صفحه ورود...</p>
        </div>
      </div>
    );
  }

  return <UserAccessProvider>{children}</UserAccessProvider>;
}

export default AuthGuard;
