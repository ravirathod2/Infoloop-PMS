import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Building2, Database, Receipt, CalendarRange, FolderKanban, LayoutDashboard, Link2, LogOut, Menu as MenuIcon, ShieldCheck, Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { Avatar, BrandMark, ConfirmDialog, IconButton, Menu, MenuItem } from './ui';

const MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/clients', label: 'Clients', icon: Building2 },
  { to: '/members', label: 'Members', icon: Users },
];
// Members never see these pages: clients and the team list are admin-only.
const ADMIN_ONLY = ['/clients', '/members'];
const SOON = [
  { to: '/roles', label: 'Roles & permissions', icon: ShieldCheck },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/timeline', label: 'Timeline', icon: CalendarRange },
  { to: '/apps', label: 'Apps & URLs', icon: Link2 },
];

export default function AppLayout() {
  const { user, signOut, isDemo } = useAuth();
  const { members, isAdmin, loadSample } = useData();
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const myAvatar = members.find((m) => m.email && m.email.toLowerCase() === user.email?.toLowerCase())?.avatar;
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const link = ({ to, label, icon: Icon }, soon) => (
    <NavLink key={to} to={to} className="nav-link">
      <Icon size={16} strokeWidth={1.75} />
      {label}
      {soon && <span className="soon-tag">Soon</span>}
    </NavLink>
  );

  return (
    <div className="app">
      <div className="mobile-bar">
        <IconButton label="Open menu" onClick={() => setOpen(true)}><MenuIcon size={18} /></IconButton>
        <BrandMark size={22} /> InfoLoop
      </div>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sb-brand"><BrandMark /> InfoLoop PMS</div>
        <nav className="sb-nav" aria-label="Main">
          {MAIN.filter((i) => isAdmin || !ADMIN_ONLY.includes(i.to)).map((i) => link(i))}
          <div className="sb-label">Coming soon</div>
          {SOON.map((i) => link(i, true))}
        </nav>

        <div className="sb-foot">
          {isDemo && (
            <div className="demo-pill"><b>Demo mode</b><br />Data is stored in this browser. Add Firebase keys to .env to go live.</div>
          )}
          <Menu
            align="left"
            up
            renderTrigger={({ toggle }) => (
              <button type="button" className="user-chip" onClick={toggle}>
                <Avatar name={user.name} src={myAvatar} size={28} />
                <span className="who"><b>{user.name}</b><span>{user.email}</span></span>
              </button>
            )}
          >
            {isAdmin && <MenuItem icon={Database} onClick={() => setSampleOpen(true)}>Load sample data</MenuItem>}
            <MenuItem icon={LogOut} onClick={async () => { await signOut(); navigate('/login'); }}>Log out</MenuItem>
          </Menu>
        </div>
      </aside>

      {sampleOpen && (
        <ConfirmDialog
          title="Load sample data?" confirmLabel="Load sample data" variant="primary" busy={sampleBusy} onCancel={() => setSampleOpen(false)}
          message="This adds about 14 members, 9 clients, 11 projects and 40 tasks, covering many different cases, next to your existing data. You can delete them one by one afterwards."
          onConfirm={async () => { setSampleBusy(true); try { await loadSample(); setSampleOpen(false); } finally { setSampleBusy(false); } }}
        />
      )}

      <main className="main">
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
