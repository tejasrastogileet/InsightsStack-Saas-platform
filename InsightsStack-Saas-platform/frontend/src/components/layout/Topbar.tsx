import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useAuthStore, useThemeStore, useUIStore } from '@/store';
import { authService, notificationService } from '@/services';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleNotificationPanel } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        if (active) setUnreadCount(response.data.count);
      } catch {
        if (active) toast.error('Could not load notification count.');
      }
    };
    const onNotificationsChanged = () => { void refreshUnreadCount(); };
    void refreshUnreadCount();
    window.addEventListener('notifications:changed', onNotificationsChanged);
    return () => {
      active = false;
      window.removeEventListener('notifications:changed', onNotificationsChanged);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authService.logout(refresh);
    } catch {
      toast.error('Could not notify the server about logout. Your local session was cleared.');
    }
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-dark-border bg-dark-surface/80 backdrop-blur-sm flex-shrink-0 relative z-30">
      {/* Search */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-card border transition-all duration-200 flex-1 max-w-md',
        searchFocused ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-dark-border'
      )}>
        <Search size={15} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search dashboards, reports, datasets..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none flex-1"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-600 bg-dark-muted rounded">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon text-slate-400 hover:text-white hover:bg-dark-card"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={toggleNotificationPanel}
          className="btn-icon text-slate-400 hover:text-white hover:bg-dark-card relative"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-card border border-transparent hover:border-dark-border transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-glow-sm">
              {user?.first_name?.[0] ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white leading-none">{user?.first_name ?? 'User'}</p>
              <p className="text-[11px] text-slate-500 capitalize">{user?.profile?.role ?? 'analyst'}</p>
            </div>
            <ChevronDown size={14} className={clsx('text-slate-500 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="dropdown-menu right-0 z-50">
                <div className="px-4 py-3 border-b border-dark-border">
                  <p className="text-sm font-medium text-white">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  className="dropdown-item w-full"
                  onClick={() => { navigate('/app/settings'); setUserMenuOpen(false); }}
                >
                  <User size={14} /> Profile
                </button>
                <button
                  className="dropdown-item w-full"
                  onClick={() => { navigate('/app/settings'); setUserMenuOpen(false); }}
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="h-px bg-dark-border my-1" />
                <button
                  className="dropdown-item w-full text-red-400 hover:text-white hover:bg-red-500"
                  onClick={handleLogout}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
