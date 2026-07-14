import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from '@tse/utils';
import { userManager } from '../../store/userManager';

function CallBackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    userManager
      .signinRedirectCallback()
      .then((user) => {
        if (cancelled) return;
        if (user?.access_token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
          sessionStorage.removeItem('healan_401_redirect_at');
          navigate('/', { replace: true });
          return;
        }
        navigate('/?auth=missing_token', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        // Avoid AuthGuard→login→callback loop when code was already consumed.
        console.error('OIDC callback failed', err);
        navigate('/?auth=callback_error', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="healan-auth-screen">
      <div className="healan-auth-card">
        <h1>Healan</h1>
        <p>در حال تکمیل ورود...</p>
      </div>
    </div>
  );
}

export default CallBackPage;
