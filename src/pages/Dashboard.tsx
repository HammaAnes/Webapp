import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingScreen from "../components/LoadingScreen";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useSEO } from "../hooks/useSEO";

import DashboardHome from "../components/dashboard/DashboardHome";
import Reservations from "./dashboard/Reservations";
import ReservationDetail from "./dashboard/ReservationDetail";
import Notifications from "./dashboard/Notifications";
import Profile from "./dashboard/Profile";
import MonEspace from "./dashboard/MonEspace";
import Parrainage from "./dashboard/Parrainage";
import Abonnements from "./dashboard/Abonnements";

const AdminUsers = lazy(() => import("./dashboard/admin/Users"));
const UserDetail = lazy(() => import("./dashboard/admin/UserDetail"));
const AdminSpaces = lazy(() => import("./dashboard/admin/Spaces"));
const EspaceDetail = lazy(() => import("./dashboard/EspaceDetail"));
const AdminReservations = lazy(() => import("./dashboard/admin/Reservations"));
const AdminReports = lazy(() => import("./dashboard/admin/Reports"));
const AdminDomiciliations = lazy(() => import("./dashboard/admin/Domiciliations"));
const DomiciliationDetail = lazy(() => import("./dashboard/admin/DomiciliationDetail"));
const AdminCodesPromo = lazy(() => import("./dashboard/admin/CodesPromo"));
const AdminParrainages = lazy(() => import("./dashboard/admin/Parrainages"));
const AdminSettings = lazy(() => import("./dashboard/admin/Settings"));
const AdminAbonnements = lazy(() => import("./dashboard/admin/Abonnements"));
const Aujourdhui = lazy(() => import("./dashboard/admin/Aujourdhui"));
const Caisse = lazy(() => import("./dashboard/admin/Caisse"));
const AdminContacts = lazy(() => import("./dashboard/admin/Contacts"));
const ContactDetail = lazy(() => import("./dashboard/admin/ContactDetail"));
const ContactCreate = lazy(() => import("./dashboard/admin/ContactCreate"));
const AdminEmail = lazy(() => import("./dashboard/admin/Email"));

const AdminGuard = React.memo(() => {
  const { isAdmin } = useAuthStore();
  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
});

AdminGuard.displayName = "AdminGuard";

const Dashboard = () => {
  useSEO({ noIndex: true });

  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route index element={<DashboardHome />} />

          <Route path="reservations" element={<Reservations />} />
          <Route path="reservations/:id" element={<ReservationDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mon-espace" element={<MonEspace />} />
          <Route path="domiciliation" element={<Navigate to="/app/mon-espace?tab=domiciliation" replace />} />
          <Route path="mon-entreprise" element={<Navigate to="/app/mon-espace?tab=entreprise" replace />} />
          <Route path="abonnements" element={<Abonnements />} />
          <Route path="parrainage" element={<Parrainage />} />
          <Route path="profil" element={<Profile />} />

          <Route path="admin/*" element={<AdminGuard />}>
            <Route path="aujourdhui" element={<Aujourdhui />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="contacts/nouveau" element={<ContactCreate />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="spaces" element={<AdminSpaces />} />
            <Route path="spaces/:id" element={<EspaceDetail />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="domiciliations" element={<AdminDomiciliations />} />
            <Route path="domiciliations/:id" element={<DomiciliationDetail />} />
            <Route path="abonnements" element={<AdminAbonnements />} />
            <Route path="codes-promo" element={<AdminCodesPromo />} />
            <Route path="parrainages" element={<AdminParrainages />} />
            <Route path="caisse" element={<Caisse />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="email" element={<AdminEmail />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
