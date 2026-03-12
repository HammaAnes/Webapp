import React, { Suspense, lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

import PublicLayout from "./components/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";

import { useScrollAnimation } from "./hooks/useScrollAnimation";
import { useAuthStore } from "./store/authStore";
import { useAppStore } from "./store/store";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const SpacesAndPricing = lazy(() => import("./pages/SpacesAndPricing"));
const About = lazy(() => import("./pages/About"));
const DomiciliationPublic = lazy(() => import("./pages/Domiciliation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Legal = lazy(() => import("./pages/Legal"));
const ERPSystem = lazy(() => import("./pages/ERPSystem"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));

import { BLOG_ENABLED } from "./data/blogArticles";
//
function App() {
  useScrollAnimation();
  const authStore = useAuthStore();
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initApp = async () => {
      await authStore.initialize();
      await useAppStore.getState().initializeData();
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authStore.isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <ScrollToTop />

        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />

            <Route
              path="/espaces"
              element={
                <PublicLayout>
                  <SpacesAndPricing />
                </PublicLayout>
              }
            />

            <Route
              path="/tarifs"
              element={
                <PublicLayout>
                  <SpacesAndPricing />
                </PublicLayout>
              }
            />

            <Route
              path="/a-propos"
              element={
                <PublicLayout>
                  <About />
                </PublicLayout>
              }
            />

            <Route
              path="/domiciliation"
              element={
                <PublicLayout>
                  <DomiciliationPublic />
                </PublicLayout>
              }
            />

            <Route
              path="/mentions-legales"
              element={
                <PublicLayout>
                  <Legal />
                </PublicLayout>
              }
            />

            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />

            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/erp/*"
              element={
                <ProtectedRoute requireAdmin>
                  <ERPSystem />
                </ProtectedRoute>
              }
            />

            {BLOG_ENABLED && (
              <>
                <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
                <Route path="/blog/:slug" element={<PublicLayout><BlogArticle /></PublicLayout>} />
              </>
            )}

            <Route
              path="*"
              element={
                <PublicLayout>
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-800 mb-4">
                        404
                      </h1>
                      <p className="text-xl text-gray-600 mb-8">
                        Page non trouvée
                      </p>
                      <Link to="/" className="btn-primary">
                        Retour à l'accueil
                      </Link>
                    </div>
                  </div>
                </PublicLayout>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
