import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from '@tse/utils';
import { userManager } from '../../store/userManager';
import healanApi from '../../api/healanApi';

function CallBackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(async (user) => {
        if (user?.access_token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
        }
        try {
          await healanApi.users.current();
        } catch {
          /* ignore */
        }
        navigate('/', { replace: true });
      })
      .catch(() => navigate('/', { replace: true }));
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
