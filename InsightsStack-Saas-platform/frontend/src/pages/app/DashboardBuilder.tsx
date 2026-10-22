import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, LayoutGrid, BarChart2, TrendingUp, PieChart as PieIcon, Table2, Gauge, Trash2, Move, Loader2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { analyticsService, dashboardService, datasetService } from '@/services';
import { useWorkspaceStore } from '@/store';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const widgetTypes = [
  { id: 'kpi', label: 'KPI Card', icon: Gauge },
  { id: 'line', label: 'Line Chart', icon: TrendingUp },
  { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
  { id: 'pie', label: 'Pie Chart', icon: PieIcon },
  { id: 'table', label: 'Data Table', icon: Table2 },
] as const;

type WidgetKind = typeof widgetTypes[number]['id'];
type ApiWidgetKind = 'kpi_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'data_table';

interface Widget {
  id: string;
  type: WidgetKind;
  title: string;
  saved: boolean;
}

interface Dataset {
  id: string;
  name: string;
  status: string;
  preview: Record<string, unknown>[];
}

interface Summary {
  dataset: { row_count: number };
  numeric_summary: { column: string; sum: number; average: number }[];
  time_series: { period: string; values: Record<string, number> }[];
  categorical_summary: { column: string; values: { value: string; count: number }[] }[];
}

const apiToUi: Record<string, WidgetKind> = {
  kpi_card: 'kpi',
  metric_gauge: 'kpi',
  line_chart: 'line',
  area_chart: 'line',
  bar_chart: 'bar',
  pie_chart: 'pie',
  data_table: 'table',
};

const uiToApi: Record<WidgetKind, ApiWidgetKind> = {
  kpi: 'kpi_card',
  line: 'line_chart',
  bar: 'bar_chart',
  pie: 'pie_chart',
  table: 'data_table',
};

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ detail?: string; error?: string }>(error)) {
    return error.response?.data?.detail ?? error.response?.data?.error ?? 'Dashboard could not be saved.';
  }
  return 'Dashboard could not be saved.';
}

function WidgetContent({
  type,
  summary,
  preview,
}: {
  type: WidgetKind;
  summary: Summary | null;
  preview: Record<string, unknown>[];
}) {
  const metric = summary?.numeric_summary[0];
  const trend = summary?.time_series.map(point => ({ period: point.period, ...point.values })) ?? [];
  const category = summary?.categorical_summary[0];

  if (!summary) {
    return <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">Select a ready dataset to preview this widget with real data.</div>;
  }
  if (type === 'kpi') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="text-3xl font-extrabold text-white">
          {metric ? metric.sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : summary.dataset.row_count.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400">{metric ? `${metric.column} · total` : 'Rows in dataset'}</p>
      </div>
    );
  }
  if (type === 'line' || type === 'bar') {
    if (!trend.length || !metric) {
      return <div className="flex h-full items-center justify-center text-sm text-slate-500">A date column and numeric metric are needed for a trend.</div>;
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <AreaChart data={trend} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
            <Area type="monotone" dataKey={metric.column} name={metric.column} stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.15} />
          </AreaChart>
        ) : (
          <BarChart data={trend} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey={metric.column} name={metric.column} fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    );
  }
  if (type === 'pie') {
    if (!category) return <div className="flex h-full items-center justify-center text-sm text-slate-500">No categorical column is available for this chart.</div>;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={category.values} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={62} innerRadius={32}>
            {category.values.map((entry, index) => <Cell key={`${entry.value}-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  const columns = Object.keys(preview[0] ?? {});
  return columns.length ? (
    <div className="h-full overflow-auto text-xs">
      <table className="w-full text-left">
        <thead><tr>{columns.slice(0, 4).map(column => <th key={column} className="p-1 text-slate-400">{column}</th>)}</tr></thead>
        <tbody>
          {preview.slice(0, 4).map((row, index) => (
            <tr key={index} className="border-t border-dark-border">
              {columns.slice(0, 4).map(column => <td key={column} className="max-w-28 truncate p-1 text-slate-300">{String(row[column] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">This dataset has no preview rows.</div>
  );
}

export default function DashboardBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceStore(state => state.currentWorkspace?.id);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [deletedWidgetIds, setDeletedWidgetIds] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [name, setName] = useState('My Dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      setWidgets([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: datasetData } = await datasetService.list(workspaceId);
      const readyDatasets: Dataset[] = datasetData.filter((dataset: Dataset) => dataset.status === 'ready');
      setDatasets(readyDatasets);

      if (!id || id === 'new') {
        setName('My Dashboard');
        setWidgets([]);
        setDeletedWidgetIds([]);
        setDatasetId(current => readyDatasets.some(dataset => dataset.id === current) ? current : readyDatasets[0]?.id ?? '');
        return;
      }

      const { data } = await dashboardService.get(id);
      setName(data.name);
      const savedWidgets: Widget[] = (data.widgets ?? []).map((widget: { id: string; title: string; widget_type: string }) => ({
        id: widget.id,
        title: widget.title,
        type: apiToUi[widget.widget_type] ?? 'table',
        saved: true,
      }));
      setWidgets(savedWidgets);
      setDeletedWidgetIds([]);
      const attachedDataset = (data.widgets ?? []).find((widget: { data_source?: string | null }) => widget.data_source)?.data_source;
      setDatasetId(current => {
        const preferred = attachedDataset ?? current;
        return readyDatasets.some(dataset => dataset.id === preferred) ? preferred : readyDatasets[0]?.id ?? '';
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      toast.error('Dashboard builder data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id, workspaceId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    if (!workspaceId || !datasetId) {
      setSummary(null);
      return () => { active = false; };
    }
    analyticsService.getDatasetSummary(workspaceId, datasetId)
      .then(({ data }) => { if (active) setSummary(data); })
      .catch((summaryError: unknown) => {
        if (active) {
          setSummary(null);
          toast.error(getErrorMessage(summaryError));
        }
      });
    return () => { active = false; };
  }, [datasetId, workspaceId]);

  const addWidget = (type: WidgetKind) => {
    const widgetType = widgetTypes.find(widget => widget.id === type);
    setWidgets(current => [...current, {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title: widgetType?.label ?? 'Widget',
      saved: false,
    }]);
  };

  const removeWidget = (widget: Widget) => {
    setWidgets(current => current.filter(item => item.id !== widget.id));
    if (widget.saved) setDeletedWidgetIds(current => [...current, widget.id]);
  };

  const saveDashboard = async () => {
    if (!workspaceId) {
      toast.error('Choose a workspace before saving a dashboard.');
      return;
    }
    if (!name.trim()) {
      toast.error('Enter a dashboard name.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let dashboardId = id && id !== 'new' ? id : '';
      if (dashboardId) {
        await dashboardService.update(dashboardId, { name: name.trim(), layout_config: { columns: 3 } });
      } else {
        const { data } = await dashboardService.create({
          name: name.trim(),
          workspace: workspaceId,
          layout_config: { columns: 3 },
        });
        dashboardId = data.id;
      }

      const persistedWidgets = [...widgets];
      for (let index = 0; index < persistedWidgets.length; index += 1) {
        const widget = persistedWidgets[index];
        const payload = {
          title: widget.title,
          widget_type: uiToApi[widget.type],
          config: {},
          position: { x: index % 3, y: Math.floor(index / 3), w: 1, h: 1 },
          data_source: datasetId || null,
        };
        if (widget.saved) {
          await dashboardService.updateWidget(dashboardId, widget.id, payload);
        } else {
          const { data } = await dashboardService.createWidget(dashboardId, payload);
          persistedWidgets[index] = { ...widget, id: data.id, saved: true };
          setWidgets([...persistedWidgets]);
        }
      }
      for (const widgetId of deletedWidgetIds) {
        await dashboardService.deleteWidget(dashboardId, widgetId);
      }
      setDeletedWidgetIds([]);
      toast.success('Dashboard saved.');
      if (!id || id === 'new') navigate(`/app/dashboards/${dashboardId}`, { replace: true });
    } catch (saveError) {
      const message = getErrorMessage(saveError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const datasetPreview = datasets.find(dataset => dataset.id === datasetId)?.preview ?? [];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <LayoutGrid size={22} className="flex-shrink-0 text-brand-400" />
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={previewMode}
            aria-label="Dashboard name"
            className="min-w-0 bg-transparent px-1 text-2xl font-bold text-white outline-none transition-colors hover:border-dark-border focus:border-brand-500 disabled:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          {datasets.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Data source
              <select value={datasetId} onChange={event => setDatasetId(event.target.value)} className="input py-2" disabled={previewMode}>
                {datasets.map(dataset => <option value={dataset.id} key={dataset.id}>{dataset.name}</option>)}
              </select>
            </label>
          )}
          <button onClick={() => setPreviewMode(value => !value)} className="btn-secondary btn-sm">
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          {!previewMode && (
            <button onClick={() => void saveDashboard()} disabled={saving} className="btn-primary btn-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Dashboard'}
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}
      {!datasets.length && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Upload a dataset to preview widgets with real workspace data.
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {!previewMode && (
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add Widget</p>
              <div className="space-y-1.5">
                {widgetTypes.map(({ id: type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => addWidget(type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-dark-card transition-all group"
                  >
                    <Icon size={15} className="text-slate-500 group-hover:text-brand-400 transition-colors" />
                    {label}
                    <Plus size={13} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={previewMode ? 'lg:col-span-5' : 'lg:col-span-4'}>
          {widgets.length === 0 ? (
            <div className="card h-64 flex flex-col items-center justify-center text-slate-600 border-dashed">
              <LayoutGrid size={40} className="opacity-20 mb-3" />
              <p className="text-sm">Add widgets from the palette to get started</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {widgets.map(widget => (
                <div key={widget.id} className="card group relative flex flex-col" style={{ height: 220 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border flex-shrink-0">
                    <p className="text-sm font-medium text-white truncate">{widget.title}</p>
                    {!previewMode && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button disabled title="Widget order follows the grid; drag sorting is not available." className="p-1 rounded text-slate-600 cursor-not-allowed">
                          <Move size={13} />
                        </button>
                        <button onClick={() => removeWidget(widget)} aria-label={`Remove ${widget.title}`} className="p-1 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 min-h-0">
                    <WidgetContent type={widget.type} summary={summary} preview={datasetPreview} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
