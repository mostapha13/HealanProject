import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from '@tse/utils';
import axios from 'axios';
import { userManager } from '../store/userManager';
import { Loading } from '@tse/components/atoms';
import HealanLayout from '../layout/HealanLayout';
import AuthGuard from '../pages/AuthGuard';
import CallBackPage from '../pages/CallBack';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const PatientsPage = lazy(() => import('../pages/Patients'));
const DoctorsPage = lazy(() => import('../pages/Doctors'));
const QueuePage = lazy(() => import('../pages/Queue'));
const AppointmentsPage = lazy(() => import('../pages/Appointments'));
const AppointmentDetailPage = lazy(() => import('../pages/Appointments/detail'));
const PrescriptionsPage = lazy(() => import('../pages/Prescriptions'));
const BasicDataLayout = lazy(() => import('../pages/BasicData/Layout'));
const CompaniesPage = lazy(() => import('../pages/BasicData/Companies'));
const InsurancePage = lazy(() => import('../pages/BasicData/Insurance'));
const ServicesPage = lazy(() => import('../pages/BasicData/Services'));
const MedicalFeesPage = lazy(() => import('../pages/BasicData/MedicalFees'));
const UsersPage = lazy(() => import('../pages/BasicData/Users'));
const ReportsPage = lazy(() => import('../pages/Reports'));
const WorkflowPage = lazy(() => import('../pages/Workflow'));
const SignaturePage = lazy(() => import('../pages/Signature'));

export default function AppRoutes() {
  useEffect(() => {
    userManager.getUser().then((user) => {
      if (user && !user.expired) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.access_token}`;
      }
    });
  }, []);

  return (
    <Suspense
      fallback={
        <div className="healan-empty" style={{ minHeight: '100vh' }}>
          <Loading color="bg-blue" />
        </div>
      }
    >
      <Routes>
        <Route path="/callback" element={<CallBackPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <HealanLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="basic-data" element={<BasicDataLayout />}>
            <Route index element={<CompaniesPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="insurance" element={<InsurancePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="fees" element={<MedicalFeesPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route path="reports" element={<ReportsPage />} />
          <Route path="workflow" element={<WorkflowPage />} />
          <Route path="signature" element={<SignaturePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
