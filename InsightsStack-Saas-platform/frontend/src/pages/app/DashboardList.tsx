import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, Globe, Lock, BarChart2, Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardService } from '@/services';
import { useWorkspaceStore } from '@/store';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  updated_at: string;
  widgets: { id: string }[];
}

const gradients = [
  'from-brand-500/20 to-violet-500/20',
  'from-violet-500/20 to-pink-500/20',
  'from-emerald-500/20 to-cyan-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-brand-500/20 to-emerald-500/20',
  'from-slate-500/20 to-brand-500/20',
];

export default function DashboardList() {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceStore(state => state.currentWorkspace?.id);
  const [search, setSearch] = useState('');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboards = useCallback(async () => {
    if (!workspaceId) {
      setDashboards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await dashboardService.list(workspaceId);
      setDashboards(data);
    } catch {
      setError('Dashboards could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadDashboards();
  }, [loadDashboards]);

  const removeDashboard = async (dashboard: Dashboard) => {
    if (!window.confirm(`Delete "${dashboard.name}" and its widgets?`)) return;
    try {
      await dashboardService.delete(dashboard.id);
      setDashboards(current => current.filter(item => item.id !== dashboard.id));
      toast.success('Dashboard deleted.');
    } catch {
      toast.error('Dashboard could not be deleted.');
    }
  };

  const filtered = dashboards.filter(dashboard =>
    `${dashboard.name} ${dashboard.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={22} className="text-brand-400" /> Dashboards
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{dashboards.length} dashboards in your workspace</p>
        </div>
        <button onClick={() => navigate('/app/dashboards/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Dashboard
        </button>
      </div>

      <input
        value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder="Search dashboards..."
        className="input w-full max-w-sm"
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-400" /></div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">{error}</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((dashboard, index) => (
            <div
              key={dashboard.id}
              className="card group cursor-pointer hover:border-brand-500/40 hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => navigate(`/app/dashboards/${dashboard.id}`)}
            >
              <div className={`h-36 rounded-t-xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center border-b border-dark-border`}>
                <BarChart2 size={40} className="text-white/20" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{dashboard.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{dashboard.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      aria-label={`Edit ${dashboard.name}`}
                      className="p-1.5 rounded-lg hover:bg-dark-muted text-slate-500 hover:text-white transition-colors"
                      onClick={event => { event.stopPropagation(); navigate(`/app/dashboards/${dashboard.id}`); }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      aria-label={`Delete ${dashboard.name}`}
                      className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"
                      onClick={event => { event.stopPropagation(); void removeDashboard(dashboard); }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border">
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1"><BarChart2 size={11} /> {dashboard.widgets.length} widgets</span>
                    <span className="flex items-center gap-1">
                      {dashboard.is_public ? <Globe size={11} className="text-emerald-400" /> : <Lock size={11} />}
                      {dashboard.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600">{new Date(dashboard.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          <div
            onClick={() => navigate('/app/dashboards/new')}
            className="card border-dashed border-dark-border hover:border-brand-500/50 cursor-pointer h-64 flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-brand-400 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center"><Plus size={22} /></div>
            <p className="text-sm font-medium">Create New Dashboard</p>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600 sm:col-span-2 xl:col-span-3">
              <ExternalLink size={40} className="mx-auto mb-3 opacity-20" />
              <p>{search ? `No dashboards match "${search}"` : 'No dashboards in this workspace yet.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
