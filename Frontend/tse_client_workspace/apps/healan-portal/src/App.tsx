import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AssistantPage from './pages/Assistant';
import BookingPage from './pages/Booking';
import PatientLayout from './pages/Patient/PatientLayout';
import PatientDashboard from './pages/Patient/Dashboard';
import PatientHistoryPage from './pages/Patient/History';
import PatientBloodPressurePage from './pages/Patient/BloodPressure';
import PatientMedicationsPage from './pages/Patient/Medications';
import { FloatingRobotButton } from './components/FloatingRobotButton';

/** Full page leave SPA → Next marketing home (nginx serves / from healan-www). */
function RedirectToPublicHome() {
  useEffect(() => {
    window.location.replace('/');
  }, []);
  return (
    <div className="healan-empty" style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
      در حال انتقال به صفحه اصلی...
    </div>
  );
}

/**
 * SPA keeps interactive app routes only.
 * Landing `/` and `/blog` are served by Next.js (healan-www) via nginx.
 */
export default function App() {
  return (
    <BrowserRouter>
      <FloatingRobotButton />
      <Routes>
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="history" element={<PatientHistoryPage />} />
          <Route path="blood-pressure" element={<PatientBloodPressurePage />} />
          <Route path="medications" element={<PatientMedicationsPage />} />
        </Route>
        <Route path="*" element={<RedirectToPublicHome />} />
      </Routes>
    </BrowserRouter>
  );
}
