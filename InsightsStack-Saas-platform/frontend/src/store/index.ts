import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  is_email_verified: boolean;
  profile: {
    role: 'admin' | 'manager' | 'analyst' | 'viewer';
    theme: 'dark' | 'light';
    timezone: string;
    mfa_enabled: boolean;
    notifications_email: boolean;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry: string;
  logo: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  organization: string;
  is_default: boolean;
}

// ─── Auth Store ───────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user: User, accessToken: string, refreshToken: string) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user: User) => set({ user }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── Theme Store ──────────────────────────────────────────────────
interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('light', next === 'light');
        set({ theme: next });
      },
      setTheme: (theme: 'dark' | 'light') => {
        document.documentElement.classList.toggle('light', theme === 'light');
        set({ theme });
      },
    }),
    { name: 'theme-storage' }
  )
);

// ─── Workspace Store ──────────────────────────────────────────────
interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  currentOrg: Organization | null;
  setCurrentWorkspace: (ws: Workspace) => void;
  setWorkspaces: (wss: Workspace[]) => void;
  setCurrentOrg: (org: Organization) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],
      currentOrg: null,
      setCurrentWorkspace: (ws: Workspace) => set({ currentWorkspace: ws }),
      setWorkspaces: (wss: Workspace[]) => set({ workspaces: wss }),
      setCurrentOrg: (org: Organization) => set({ currentOrg: org }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state: WorkspaceState) => ({
        currentWorkspace: state.currentWorkspace,
        currentOrg: state.currentOrg,
      }),
    }
  )
);

// ─── UI Store (sidebar, modals) ───────────────────────────────────
interface UIState {
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  toggleSidebar: () => set((state: UIState) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (v: boolean) => set({ sidebarCollapsed: v }),
  toggleNotificationPanel: () => set((state: UIState) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
  setNotificationPanelOpen: (v: boolean) => set({ notificationPanelOpen: v }),
}));
