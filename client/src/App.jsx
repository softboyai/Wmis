import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ThemeCustomizer from './components/ThemeCustomizer.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import LocationsPage from './pages/LocationsPage.jsx';
import ReceiptsPage from './pages/ReceiptsPage.jsx';
import DispatchesPage from './pages/DispatchesPage.jsx';
import StockPage from './pages/StockPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ActivityLogsPage from './pages/ActivityLogsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return children;
}

function RootPage() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
    </div>
  );
  if (user) return <AppLayout />;
  if (location.pathname === '/') return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-0">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
      </div>
    }>
      <HomePage />
    </Suspense>
  );
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Protected routes */}
        <Route path="/" element={<RootPage />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="suppliers" element={<RequireAuth roles={['administrator']}><SuppliersPage /></RequireAuth>} />
          <Route path="clients" element={<RequireAuth roles={['administrator']}><ClientsPage /></RequireAuth>} />
          <Route path="locations" element={<RequireAuth roles={['administrator']}><LocationsPage /></RequireAuth>} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="dispatches" element={<DispatchesPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="reports" element={<RequireAuth roles={['administrator', 'manager']}><ReportsPage /></RequireAuth>} />
          <Route path="logs" element={<RequireAuth roles={['administrator']}><ActivityLogsPage /></RequireAuth>} />
          <Route path="users" element={<RequireAuth roles={['administrator']}><UsersPage /></RequireAuth>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Theme customizer — only shown when logged in */}
      {user && <ThemeCustomizer />}
    </>
  );
}
