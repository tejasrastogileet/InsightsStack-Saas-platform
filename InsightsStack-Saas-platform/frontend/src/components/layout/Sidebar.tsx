import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Brain, FileText, Database,
  Bell, Building2, ScrollText, Settings, ShieldCheck,
  ChevronLeft, ChevronRight, TrendingUp, LogOut, Zap
} from 'lucide-react';
import { useAuthStore, useUIStore, useWorkspaceStore } from '@/store';
import { authService } from '@/services';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/app/dashboard',      section: 'main' },
  { icon: BarChart3,       label: 'Analytics',      path: '/app/analytics',      section: 'main' },
  { icon: Brain,           label: 'AI Insights',    path: '/app/ai',             section: 'main' },
  { icon: FileText,        label: 'Reports',        path: '/app/reports',        section: 'main' },
  { icon: Database,        label: 'Datasets',       path: '/app/datasets',       section: 'main' },
  { icon: Bell,            label: 'Notifications',  path: '/app/notifications',  section: 'system' },
  { icon: Building2,       label: 'Organization',   path: '/app/organization',   section: 'system' },
  { icon: ScrollText,      label: 'Audit Logs',     path: '/app/audit',          section: 'system' },
  { icon: ShieldCheck,     label: 'Admin',          path: '/app/admin',          section: 'system' },
  { icon: Settings,        label: 'Settings',       path: '/app/settings',       section: 'system' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authService.logout(refresh);
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const mainNav  = NAV_ITEMS.filter(i => i.section === 'main');
  const systemNav = NAV_ITEMS.filter(i => i.section === 'system');

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-full z-40 flex flex-col bg-dark-surface border-r border-dark-border transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="text-white font-bold text-base tracking-tight truncate">InsightStack</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Enterprise</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-dark-card transition-all flex-shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Workspace Switcher */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-b border-dark-border">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Workspace</p>
          <select
            className="w-full bg-dark-card border border-dark-border text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500"
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const ws = workspaces.find(w => w.id === e.target.value);
              if (ws) setCurrentWorkspace(ws);
            }}
          >
            {workspaces.length === 0 && (
              <option value="">Default Workspace</option>
            )}
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {/* Main section */}
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 pb-2">Main</p>
        )}
        {mainNav.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="icon flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-dark-border my-3" />

        {/* System section */}
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 pb-2">System</p>
        )}
        {systemNav.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="icon flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-dark-border p-3">
        <div className={clsx('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-glow-sm">
            {user?.first_name?.[0] ?? 'U'}
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.profile?.role ?? 'analyst'}</p>
            </div>
          )}

          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
