import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Link2, Receipt, BarChart3, CalendarRange, ShieldCheck } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { DataProvider, useData } from './data/DataContext';
import { isMemberActive } from './lib/constants';
import { Button, EmptyState } from './components/ui';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';
import TaskDetail from './pages/TaskDetail';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ComingSoon from './pages/ComingSoon';

function Splash() {
  return (
    <div className="splash"><span className="spinner" /></div>
  );
}

/** A member whose owner marked them Inactive can sign in but not use the workspace. */
function Gate() {
  const { me, ready } = useData();
  const { signOut } = useAuth();
  if (ready && me && !isMemberActive(me)) {
    return (
      <div className="splash">
        <EmptyState
          title="Your access is turned off"
          description="Your account has been set to inactive. Ask the workspace owner to reactivate it."
          action={<Button onClick={signOut}>Log out</Button>}
        />
      </div>
    );
  }
  return <AppLayout />;
}

/** Clients and Members pages are for the admin only; members are sent back to the dashboard. */
function AdminOnly() {
  const { isAdmin, ready } = useData();
  if (!ready) return <Splash />;
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/** Everything inside requires a signed-in user; otherwise redirect to /login. */
function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <DataProvider>
      <Gate />
    </DataProvider>
  );
}

/** Login / signup / forgot password are hidden once signed in. */
function PublicOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectBoard />} />
        <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
        <Route element={<AdminOnly />}>
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientDetail />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:memberId" element={<MemberDetail />} />
        </Route>
        <Route path="/roles" element={<ComingSoon icon={ShieldCheck} title="Roles & permissions" description="Define what each member can see and do across projects. This is on the way." />} />
        <Route path="/invoices" element={<ComingSoon icon={Receipt} title="Invoices" description="Create and send invoices to clients, and track payments. This is on the way." />} />
        <Route path="/reports" element={<ComingSoon icon={BarChart3} title="Reports" description="Delivery, workload and time reports across your projects. This is on the way." />} />
        <Route path="/timeline" element={<ComingSoon icon={CalendarRange} title="Timeline" description="A Gantt-style view of every project and its deadlines. This is on the way." />} />
        <Route path="/apps" element={<ComingSoon icon={Link2} title="Apps & URLs" description="Connect the tools and links your team uses every day. This is on the way." />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
