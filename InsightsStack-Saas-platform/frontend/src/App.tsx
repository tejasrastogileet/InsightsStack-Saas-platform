import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import AppShell from '@/layouts/AppShell';
import AuthLayout from '@/layouts/AuthLayout';

// Auth pages
import LandingPage    from '@/pages/Landing';
import LoginPage      from '@/pages/auth/Login';
import RegisterPage   from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// App pages
import DashboardHome    from '@/pages/app/DashboardHome';
import DashboardList    from '@/pages/app/DashboardList';
import DashboardBuilder from '@/pages/app/DashboardBuilder';
import Analytics        from '@/pages/app/Analytics';
import AIInsights       from '@/pages/app/AIInsights';
import Reports          from '@/pages/app/Reports';
import Datasets         from '@/pages/app/Datasets';
import Notifications    from '@/pages/app/Notifications';
import Organization     from '@/pages/app/Organization';
import AuditLogs        from '@/pages/app/AuditLogs';
import Settings         from '@/pages/app/Settings';
import AdminPanel       from '@/pages/app/AdminPanel';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public-only route (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/app/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        </Route>

        {/* Protected App */}
        <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"          element={<DashboardHome />} />
          <Route path="dashboards"         element={<DashboardList />} />
          <Route path="dashboards/:id"     element={<DashboardBuilder />} />
          <Route path="analytics"          element={<Analytics />} />
          <Route path="ai"                 element={<AIInsights />} />
          <Route path="reports"            element={<Reports />} />
          <Route path="datasets"           element={<Datasets />} />
          <Route path="notifications"      element={<Notifications />} />
          <Route path="organization"       element={<Organization />} />
          <Route path="audit"              element={<AuditLogs />} />
          <Route path="settings"           element={<Settings />} />
          <Route path="admin"              element={<AdminPanel />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
