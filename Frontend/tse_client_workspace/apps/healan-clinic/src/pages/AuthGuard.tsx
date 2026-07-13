import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { userManager } from '../store/userManager';
import { UserAccessProvider } from '../context/UserAccessContext';

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
        const user = await userManager.getUser();
        if (user && !user.expired) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
          if (!cancelled) setReady(true);
          return;
        }
        await userManager.signinRedirect();
      } catch (err) {
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
