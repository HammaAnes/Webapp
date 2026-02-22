import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingScreen from "../components/LoadingScreen";
import DashboardLayout from "../components/dashboard/DashboardLayout";

// Import direct des composants
import DashboardHome from "../components/dashboard/DashboardHome";
import Reservations from "./dashboard/Reservations";
import ReservationDetail from "./dashboard/ReservationDetail";
import Notifications from "./dashboard/Notifications";
import Profile from "./dashboard/Profile";
import MonEspace from "./dashboard/MonEspace";
import Parrainage from "./dashboard/Parrainage";
import CodesPromo from "./dashboard/CodesPromo";
import Abonnements from "./dashboard/Abonnements";
// Admin pages
import AdminUsers from "./dashboard/admin/Users";
import UserDetail from "./dashboard/admin/UserDetail";
import AdminSpaces from "./dashboard/admin/Spaces";
import EspaceDetail from "./dashboard/EspaceDetail";
import AdminReservations from "./dashboard/admin/Reservations";
import AdminReports from "./dashboard/admin/Reports";
import AdminDomiciliations from "./dashboard/admin/Domiciliations";
import AdminCodesPromo from "./dashboard/admin/CodesPromo";
import AdminParrainages from "./dashboard/admin/Parrainages";
import AdminSettings from "./dashboard/admin/Settings";
import AdminAbonnements from "./dashboard/admin/Abonnements";
import Aujourdhui from "./dashboard/admin/Aujourdhui";
import WalkIns from "./dashboard/admin/WalkIns";
import Blocages from "./dashboard/admin/Blocages";
import SystemTests from "./dashboard/admin/SystemTests";

const Dashboard = () => {
  const { user } = useAuthStore();

  // Redirection si non authentifié
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Page d'accueil du dashboard */}
          <Route index element={<DashboardHome />} />

          {/* Routes utilisateur standard */}
          <Route path="reservations" element={<Reservations />} />
          <Route path="reservations/:id" element={<ReservationDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="mon-espace" element={<MonEspace />} />
          <Route path="domiciliation" element={<Navigate to="/app/mon-espace?tab=domiciliation" replace />} />
          <Route path="mon-entreprise" element={<Navigate to="/app/mon-espace?tab=entreprise" replace />} />
          <Route path="abonnements" element={<Abonnements />} />
          <Route path="codes-promo" element={<CodesPromo />} />
          <Route path="parrainage" element={<Parrainage />} />
          <Route path="profil" element={<Profile />} />

          {/* Routes admin */}
          {user?.role === "admin" && (
            <>
              <Route path="admin/aujourdhui" element={<Aujourdhui />} />
              <Route path="admin/walk-ins" element={<WalkIns />} />
              <Route path="admin/blocages" element={<Blocages />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/users/:id" element={<UserDetail />} />
              <Route path="admin/spaces" element={<AdminSpaces />} />
              <Route path="admin/spaces/:id" element={<EspaceDetail />} />
              <Route
                path="admin/reservations"
                element={<AdminReservations />}
              />
              <Route
                path="admin/domiciliations"
                element={<AdminDomiciliations />}
              />
              <Route path="admin/abonnements" element={<AdminAbonnements />} />
              <Route path="admin/codes-promo" element={<AdminCodesPromo />} />
              <Route path="admin/parrainages" element={<AdminParrainages />} />
              <Route path="admin/reports" element={<AdminReports />} />
              <Route path="admin/settings" element={<AdminSettings />} />
              <Route path="admin/tests" element={<SystemTests />} />
            </>
          )}

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
