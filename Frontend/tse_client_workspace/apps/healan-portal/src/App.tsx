import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/Landing';
import BlogListPage from './pages/Blog/List';
import BlogPostPage from './pages/Blog/Post';
import AssistantPage from './pages/Assistant';
import BookingPage from './pages/Booking';
import PatientLayout from './pages/Patient/PatientLayout';
import PatientDashboard from './pages/Patient/Dashboard';
import PatientHistoryPage from './pages/Patient/History';
import PatientBloodPressurePage from './pages/Patient/BloodPressure';
import PatientMedicationsPage from './pages/Patient/Medications';
import { FloatingRobotButton } from './components/FloatingRobotButton';

export default function App() {
  return (
    <BrowserRouter>
      <FloatingRobotButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="history" element={<PatientHistoryPage />} />
          <Route path="blood-pressure" element={<PatientBloodPressurePage />} />
          <Route path="medications" element={<PatientMedicationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
