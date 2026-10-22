import { useCallback, useEffect, useState } from 'react';
import { Search, Shield, User, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { auditService } from '@/services';
import { useWorkspaceStore } from '@/store';

interface AuditEvent {
  id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  ip_address: string | null;
  created_at: string;
}

const actionColor: Record<string, string> = {
  create: 'badge-primary',
  update: 'badge-violet',
  delete: 'badge-warning',
  login: 'badge-success',
  logout: 'badge-muted',
  export: 'badge-violet',
  import: 'badge-success',
  share: 'badge-primary',
};

function errorMessage(error: unknown) {
  return isAxiosError<{ detail?: string; error?: string }>(error)
    ? error.response?.data?.detail ?? error.response?.data?.error ?? 'Audit events could not be loaded.'
    : 'Audit events could not be loaded.';
}

export default function AuditLogs() {
  const workspaceId = useWorkspaceStore(state => state.currentWorkspace?.id);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    if (!workspaceId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await auditService.getLogs({ workspace: workspaceId, action: action || undefined });
      setEvents(Array.isArray(data) ? data : data.results ?? []);
    } catch (loadError) {
      const message = errorMessage(loadError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [action, workspaceId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filtered = events.filter(event =>
    `${event.user_name ?? ''} ${event.user_email ?? ''} ${event.action} ${event.resource_type} ${event.resource_name}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield size={22} className="text-brand-400" /> Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">Recorded dataset, dashboard, and report actions in this workspace.</p>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <Search size={15} className="text-slate-500 flex-shrink-0" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search by user, action, or resource..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none flex-1"
        />
        <select value={action} onChange={event => setAction(event.target.value)} className="input py-2">
          <option value="">All actions</option>
          {Object.keys(actionColor).map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-400" /></div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p role="alert" className="text-sm text-red-300">{error}</p>
          <button onClick={() => void loadEvents()} className="btn-secondary btn-sm mt-3">Retry</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Resource</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">IP</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map(event => (
                  <tr key={event.id} className="hover:bg-dark-card/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"><User size={10} /></div>
                        <span className="text-slate-300">{event.user_name || event.user_email || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${actionColor[event.action] ?? 'badge-muted'} text-[10px]`}>{event.action.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-slate-400">{event.resource_type}: {event.resource_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{event.ip_address ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(event.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-600">{query ? `No logs matching "${query}"` : 'No audit events recorded for this workspace yet.'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
