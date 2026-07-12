import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function FloatingRobotButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/assistant')) {
    return null;
  }

  return (
    <button
      type="button"
      className="portal-robot-fab"
      aria-label="پرسش از دستیار هوشمند"
      title="پرسش از دستیار هوشمند"
      onClick={() => navigate('/assistant')}
    >
      <span className="portal-robot-fab__icon" aria-hidden>
        🤖
      </span>
    </button>
  );
}
