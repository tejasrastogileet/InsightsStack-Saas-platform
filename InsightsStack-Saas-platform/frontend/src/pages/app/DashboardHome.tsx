import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart2, Database, DollarSign, TrendingUp, Users } from 'lucide-react';
import { analyticsService, datasetService } from '@/services';
import { useWorkspaceStore } from '@/store';
import { mockKPIs, mockRevenueTrend } from '@/utils/mockData';
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
  period: string;
}

const periods = ['3m', '6m', '1y'] as const;
type Period = typeof periods[number];
const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

const money = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

function DemoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 text-xs space-y-1 shadow-xl">
      <p className="text-slate-400 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>{entry.name}: {money(entry.value)}</p>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState('');
  const [period, setPeriod] = useState<Period>('1y');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    if (!workspaceId) {
      setDatasets([]);
      setDatasetId('');
      setDatasetsLoading(false);
      return () => { active = false; };
    }
    setDatasetsLoading(true);
    datasetService.list(workspaceId)
      .then(({ data }) => {
        if (!active) return;
        const readyDatasets = data.filter((dataset: Dataset) => dataset.status === 'ready');
        setDatasets(readyDatasets);
        setDatasetId((current) => readyDatasets.some((dataset: Dataset) => dataset.id === current)
          ? current
          : readyDatasets[0]?.id ?? '');
      })
      .catch(() => {
        if (active) setLoadError('Could not load workspace datasets.');
      })
      .finally(() => {
        if (active) setDatasetsLoading(false);
      });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    if (!workspaceId || !datasetId) {
      setSummary(null);
      return () => { active = false; };
    }
    setSummaryLoading(true);
    setLoadError('');
    analyticsService.getDatasetSummary(workspaceId, datasetId, period)
      .then(({ data }) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) {
          setSummary(null);
          setLoadError('Analytics could not be calculated for this dataset.');
          toast.error('Analytics could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => { active = false; };
  }, [datasetId, period, workspaceId]);

  const isDemo = datasets.length === 0 && !datasetsLoading && !loadError;
  const realKpis = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: 'Rows in selected period',
        description: 'Filtered dataset rows',
        value: summary.dataset.row_count.toLocaleString(),
        icon: Database,
      },
      ...summary.numeric_summary.slice(0, 3).map((metric, index) => ({
        label: `Total ${metric.column}`,
        description: `Sum of dataset column "${metric.column}"`,
        value: money(metric.sum),
        icon: /revenue|sales|amount|price|cost|profit|income|total/i.test(metric.column)
          ? DollarSign
          : [TrendingUp, BarChart2][index % 2],
      })),
    ];
  }, [summary]);
  const chartData = summary?.time_series.map((point) => ({ period: point.period, ...point.values })) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Workspace analytics from your selected dataset</p>
        </div>
        {datasets.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Dataset
            <select value={datasetId} onChange={(event) => setDatasetId(event.target.value)} className="input py-2">
              {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {isDemo ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Sample preview — these demo metrics are not connected to your workspace. Upload a dataset to view its analytics.
        </div>
      ) : summary && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-sm text-brand-200">
          Live dataset: <span className="font-semibold">{summary.dataset.name}</span> · {summary.dataset.columns.length} columns
        </div>
      )}

      {loadError && <p role="alert" className="text-sm text-red-400">{loadError}</p>}
      {summaryLoading && <p className="text-xs text-slate-500">Calculating analytics…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary ? realKpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="w-10 h-10 rounded-xl border border-brand-500/20 bg-brand-500/10 flex items-center justify-center mb-4">
              <kpi.icon size={18} className="text-brand-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1 truncate">{kpi.label}</p>
            <p className="text-2xl font-bold text-white truncate">{kpi.value}</p>
            <p className="text-xs text-slate-600 mt-1">{kpi.description}</p>
          </div>
        )) : isDemo ? mockKPIs.map((kpi) => (
          <div key={kpi.id} className="card p-5">
            <div className="w-10 h-10 rounded-xl border border-brand-500/20 bg-brand-500/10 flex items-center justify-center mb-4">
              <Activity size={18} className="text-brand-400" />
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-amber-300 mt-1">Demo sample</p>
          </div>
        )) : !datasetsLoading && (
          <div className="card p-8 sm:col-span-2 xl:col-span-4 text-center text-sm text-slate-500">
            Upload a ready dataset to calculate workspace KPIs.
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-white font-semibold">{summary ? 'Dataset numeric trends' : 'Revenue & Profit · Sample'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
            {summary
              ? summary.date_column
                ? `Grouped by ${summary.date_column} · ${summary.period}`
                : `${summary.dataset.row_count.toLocaleString()} actual records · no date column detected`
              : 'Illustrative demo metrics'}
            </p>
          </div>
          <div className="flex gap-1">
            {periods.map((range) => (
              <button key={range} onClick={() => setPeriod(range)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${period === range ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-white hover:bg-dark-card'}`}>
                {range}
              </button>
            ))}
          </div>
        </div>
        {summary && summary.date_column ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DemoTooltip />} />
              {summary.numeric_summary.slice(0, 4).map((metric, index) => (
                <Area key={metric.column} type="monotone" dataKey={metric.column} name={metric.column} stroke={colors[index]} fill={colors[index]} fillOpacity={0.08} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : isDemo ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockRevenueTrend.slice(-({ '3m': 3, '6m': 6, '1y': 12 }[period]))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DemoTooltip />} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
            Select data with a date/time column to view trends. The summary cards show aggregates for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
