import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from '@tse/utils';
import { userManager } from '../../store/userManager';

function CallBackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then((user) => {
        if (user?.access_token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
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
