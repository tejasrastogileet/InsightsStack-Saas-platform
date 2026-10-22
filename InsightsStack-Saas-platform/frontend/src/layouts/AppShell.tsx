import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import NotificationPanel from '@/components/layout/NotificationPanel';
import { orgService, userService, workspaceService } from '@/services';
import { useAuthStore, useUIStore, useWorkspaceStore } from '@/store';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

export default function AppShell() {
  const { sidebarCollapsed, notificationPanelOpen } = useUIStore();
  const { setUser, logout } = useAuthStore();
  const {
    currentWorkspace,
    setCurrentOrg,
    setCurrentWorkspace,
    setWorkspaces,
  } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([userService.me(), workspaceService.list(), orgService.list()])
      .then(([userResult, workspaceResult, organizationResult]) => {
        if (!active) return;
        const workspaces = workspaceResult.data;
        setUser(userResult.data);
        setWorkspaces(workspaces);
        const selected = workspaces.find((workspace: { id: string }) => workspace.id === currentWorkspace?.id)
          ?? workspaces[0];
        if (selected) {
          setCurrentWorkspace(selected);
          const organization = organizationResult.data.find(
            (org: { id: string }) => org.id === selected.organization,
          );
          if (organization) setCurrentOrg(organization);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isAxiosError(error) && error.response?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        toast.error('Could not load your account and workspaces.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentWorkspace?.id, logout, navigate, setCurrentOrg, setCurrentWorkspace, setUser, setWorkspaces]);

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '256px' }}
      >
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading your workspace...</div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Notification panel overlay */}
      {notificationPanelOpen && <NotificationPanel />}
    </div>
  );
}
