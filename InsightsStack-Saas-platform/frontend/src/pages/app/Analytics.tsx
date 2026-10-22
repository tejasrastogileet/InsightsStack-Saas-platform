import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart2, Database } from 'lucide-react';
import { analyticsService, datasetService } from '@/services';
import { useWorkspaceStore } from '@/store';
import { mockRevenueTrend } from '@/utils/mockData';
import toast from 'react-hot-toast';

interface Dataset {
  id: string;
  name: string;
  status: string;
}

interface Summary {
  dataset: { id: string; name: string; row_count: number; columns: { name: string; type: string }[] };
  date_column: string | null;
  numeric_summary: { column: string; sum: number; average: number; minimum: number; maximum: number }[];
  time_series: { period: string; values: Record<string, number> }[];
  categorical_summary: { column: string; values: { value: string; count: number }[] }[];
}

const ranges = ['3m', '6m', '1y'] as const;
type Range = typeof ranges[number];
const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Analytics() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState('');
  const [range, setRange] = useState<Range>('1y');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const demo = !loading && !error && datasets.length === 0;

  useEffect(() => {
    let active = true;
    if (!workspaceId) {
      setDatasets([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    datasetService.list(workspaceId)
      .then(({ data }) => {
        if (!active) return;
        const ready = data.filter((dataset: Dataset) => dataset.status === 'ready');
        setDatasets(ready);
        setDatasetId((selected) => ready.some((dataset: Dataset) => dataset.id === selected) ? selected : ready[0]?.id ?? '');
      })
      .catch(() => {
        if (active) setError('Datasets could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    if (!workspaceId || !datasetId) {
      setSummary(null);
      return () => { active = false; };
    }
    setLoading(true);
    setError('');
    analyticsService.getDatasetSummary(workspaceId, datasetId, range)
      .then(({ data }) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) {
          setError('Analytics could not be calculated for this dataset.');
          setSummary(null);
          toast.error('Analytics could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [datasetId, range, workspaceId]);

  const trend = summary?.time_series.map((point) => ({ period: point.period, ...point.values }) ) ?? [];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 size={22} className="text-brand-400" /> Analytics Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Explore metrics calculated from your selected dataset</p>
        </div>
        {datasets.length > 0 && (
          <label className="text-xs text-slate-400 flex items-center gap-2">
            Dataset
            <select value={datasetId} onChange={(event) => setDatasetId(event.target.value)} className="input py-2">
              {datasets.map((dataset) => <option value={dataset.id} key={dataset.id}>{dataset.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {demo && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Demo sample view — these illustrative values are not workspace data. Upload a dataset to explore real metrics.
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <Database size={18} className="text-brand-400 mb-3" />
              <p className="text-xs text-slate-500 uppercase">Rows in period</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.dataset.row_count.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <BarChart2 size={18} className="text-violet-400 mb-3" />
              <p className="text-xs text-slate-500 uppercase">Detected columns</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.dataset.columns.length}</p>
            </div>
            {summary.numeric_summary.slice(0, 2).map((metric) => (
              <div className="card p-5" key={metric.column}>
                <p className="text-xs text-slate-500 uppercase truncate">{metric.column} · average</p>
                <p className="text-2xl font-bold text-white mt-1">{metric.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-500 mt-1">Sum: {metric.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 w-fit">
            {ranges.map((value) => (
              <button key={value} onClick={() => setRange(value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${range === value ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {value}
              </button>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="text-white font-semibold mb-1">Numeric metrics over time</h2>
            <p className="text-xs text-slate-500 mb-5">{summary.date_column ? `Grouped by ${summary.date_column}` : 'No date column detected in this dataset.'}</p>
            {summary.date_column && trend.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                  {summary.numeric_summary.slice(0, 4).map((metric, index) => (
                    <Area key={metric.column} type="monotone" dataKey={metric.column} name={metric.column} stroke={colors[index]} fill={colors[index]} fillOpacity={0.08} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">Numeric totals and averages above are based on the selected date range.</p>
            )}
          </div>

          {summary.categorical_summary.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {summary.categorical_summary.slice(0, 4).map((category, index) => (
                <div key={category.column} className="card p-6">
                  <h2 className="text-white font-semibold mb-4">{category.column} distribution</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={category.values} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis type="category" dataKey="value" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="count" fill={colors[index]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </>
      ) : demo ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold">Sample revenue series</h2>
              <p className="text-xs text-slate-500 mt-1">Illustrative demo values only</p>
            </div>
            <div className="flex gap-1">
              {ranges.map((value) => <button key={value} onClick={() => setRange(value)} className={`px-3 py-1 rounded-lg text-xs ${range === value ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>{value}</button>)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={mockRevenueTrend.slice(-({ '3m': 3, '6m': 6, '1y': 12 }[range]))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-slate-400">
          {loading ? 'Loading workspace analytics…' : 'Upload a ready dataset to view analytics.'}
        </div>
      )}
    </div>
  );
}
