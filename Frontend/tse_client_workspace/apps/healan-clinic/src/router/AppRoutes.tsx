import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from '@tse/utils';
import { userManager } from '../store/userManager';
import { Loading } from '@tse/components/atoms';
import HealanLayout from '../layout/HealanLayout';
import AuthGuard from '../pages/AuthGuard';
import CallBackPage from '../pages/CallBack';
import AccessRouteGuard from '../components/AccessRouteGuard';
import { setClinicBearerToken } from '../utils/setClinicBearerToken';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const PatientsPage = lazy(() => import('../pages/Patients'));
const DoctorsPage = lazy(() => import('../pages/Doctors'));
const QueuePage = lazy(() => import('../pages/Queue'));
const AppointmentsPage = lazy(() => import('../pages/Appointments'));
const AppointmentDetailPage = lazy(() => import('../pages/Appointments/detail'));
const PrescriptionsPage = lazy(() => import('../pages/Prescriptions'));
const BasicDataLayout = lazy(() => import('../pages/BasicData/Layout'));
const InsurancePage = lazy(() => import('../pages/BasicData/Insurance'));
const ServicesPage = lazy(() => import('../pages/BasicData/Services'));
const MedicalFeesPage = lazy(() => import('../pages/BasicData/MedicalFees'));
const UsersPage = lazy(() => import('../pages/BasicData/Users'));
const AccessFormsPage = lazy(() => import('../pages/BasicData/AccessForms'));
const AccessRolesPage = lazy(() => import('../pages/BasicData/AccessRoles'));
const AssistantSettingsPage = lazy(() => import('../pages/BasicData/AssistantSettings'));
const SiteContentLayout = lazy(() => import('../pages/SiteContent/Layout'));
const SiteContentSettingsPage = lazy(() => import('../pages/SiteContent/Settings'));
const SiteContentSectionsPage = lazy(() => import('../pages/SiteContent/Sections'));
const SiteContentReviewsPage = lazy(() => import('../pages/SiteContent/Reviews'));
const SiteContentBlogPage = lazy(() => import('../pages/SiteContent/Blog'));
const SiteContentRagPage = lazy(() => import('../pages/SiteContent/Rag'));
const SiteContentRagLogsPage = lazy(() => import('../pages/SiteContent/RagLogs'));
const ReportsPage = lazy(() => import('../pages/Reports'));
const ReportsLayout = lazy(() => import('../pages/Reports/Layout'));
const SmsOutboxPage = lazy(() => import('../pages/Reports/SmsOutbox'));
const SmsSettingsPage = lazy(() => import('../pages/Reports/SmsSettings'));
const WorkflowPage = lazy(() => import('../pages/Workflow'));
const SignaturePage = lazy(() => import('../pages/Signature'));
const ProfilePage = lazy(() => import('../pages/Profile'));

function guarded(path: string, element: React.ReactNode) {
  return <AccessRouteGuard path={path}>{element}</AccessRouteGuard>;
}

export default function AppRoutes() {
  useEffect(() => {
    userManager.getUser().then((user) => {
      if (user && !user.expired && user.access_token) {
        setClinicBearerToken(user.access_token);
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
          <Route index element={guarded('/', <Dashboard />)} />
          <Route path="queue" element={guarded('/queue', <QueuePage />)} />
          <Route path="appointments" element={guarded('/appointments', <AppointmentsPage />)} />
          <Route path="appointments/:id" element={guarded('/appointments', <AppointmentDetailPage />)} />
          <Route path="patients" element={guarded('/patients', <PatientsPage />)} />
          <Route path="doctors" element={guarded('/doctors', <DoctorsPage />)} />
          <Route path="prescriptions" element={guarded('/prescriptions', <PrescriptionsPage />)} />
          <Route path="basic-data" element={guarded('/basic-data', <BasicDataLayout />)}>
            <Route index element={guarded('/basic-data/insurance', <InsurancePage />)} />
            <Route path="insurance" element={guarded('/basic-data/insurance', <InsurancePage />)} />
            <Route path="services" element={guarded('/basic-data/services', <ServicesPage />)} />
            <Route path="fees" element={guarded('/basic-data/fees', <MedicalFeesPage />)} />
            <Route path="users" element={guarded('/basic-data/users', <UsersPage />)} />
            <Route path="assistant" element={guarded('/basic-data/assistant', <AssistantSettingsPage />)} />
            <Route path="access" element={guarded('/basic-data/access', <AccessFormsPage />)} />
            <Route path="access-roles" element={guarded('/basic-data/access-roles', <AccessRolesPage />)} />
          </Route>
          <Route path="site-content" element={guarded('/site-content', <SiteContentLayout />)}>
            <Route index element={guarded('/site-content/settings', <SiteContentSettingsPage />)} />
            <Route path="settings" element={guarded('/site-content/settings', <SiteContentSettingsPage />)} />
            <Route path="sections" element={guarded('/site-content/sections', <SiteContentSectionsPage />)} />
            <Route path="blog" element={guarded('/site-content/blog', <SiteContentBlogPage />)} />
            <Route path="rag" element={guarded('/site-content/rag', <SiteContentRagPage />)} />
            <Route path="rag-logs" element={guarded('/site-content/rag-logs', <SiteContentRagLogsPage />)} />
            <Route path="reviews" element={guarded('/site-content/reviews', <SiteContentReviewsPage />)} />
          </Route>
          <Route path="reports" element={guarded('/reports', <ReportsLayout />)}>
            <Route index element={guarded('/reports', <ReportsPage />)} />
            <Route path="sms" element={guarded('/reports/sms', <SmsOutboxPage />)} />
            <Route path="sms-settings" element={guarded('/reports/sms-settings', <SmsSettingsPage />)} />
          </Route>
          <Route path="workflow" element={guarded('/workflow', <WorkflowPage />)} />
          <Route path="signature" element={guarded('/signature', <SignaturePage />)} />
          <Route path="profile" element={guarded('/profile', <ProfilePage />)} />
        </Route>
      </Routes>
    </Suspense>
  );
}
