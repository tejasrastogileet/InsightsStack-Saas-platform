import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, FileType, FileSpreadsheet, Plus, Search, Share2, X } from 'lucide-react';
import { datasetService, reportService } from '@/services';
import { useWorkspaceStore } from '@/store';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

interface Report {
  id: string;
  name: string;
  description: string;
  config: { dataset_id?: string };
  created_at: string;
}

interface Dataset {
  id: string;
  name: string;
  status: string;
}

const statusIcon = { ready: CheckCircle2, pending: Clock, error: AlertCircle };

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setReports([]);
      setDatasets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [reportResponse, datasetResponse] = await Promise.all([
        reportService.list(workspaceId),
        datasetService.list(workspaceId),
      ]);
      setReports(reportResponse.data);
      const readyDatasets = datasetResponse.data.filter((dataset: Dataset) => dataset.status === 'ready');
      setDatasets(readyDatasets);
      setDatasetId((current) => readyDatasets.some((dataset: Dataset) => dataset.id === current)
        ? current
        : readyDatasets[0]?.id ?? '');
    } catch {
      setError('Reports and datasets could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async (report: Report, selectedFormat: 'pdf' | 'csv' | 'xlsx') => {
    const response = await reportService.export(report.id, selectedFormat);
    saveBlob(response.data, `${report.name.replace(/[^\w.-]+/g, '-')}.${selectedFormat}`);
  };

  const createReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceId || !datasetId) {
      toast.error('Select a ready dataset before generating a report.');
      return;
    }
    setGenerating(true);
    try {
      const response = await reportService.create({
        workspace: workspaceId,
        name: name.trim(),
        description: description.trim(),
        config: { dataset_id: datasetId },
      });
      const created = response.data as Report;
      window.dispatchEvent(new Event('notifications:changed'));
      setCreating(false);
      setName('');
      setDescription('');
      try {
        await download(created, format);
        toast.success('Report created and downloaded.');
      } catch {
        toast.error('Report was saved, but its download failed. Try downloading it again from the list.');
      }
      await load();
    } catch (createError) {
      const message = isAxiosError(createError)
        ? createError.response?.data?.config?.[0] ?? createError.response?.data?.workspace?.[0] ?? 'Report could not be created.'
        : 'Report could not be created.';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const filtered = reports.filter((report) =>
    report.name.toLowerCase().includes(search.toLowerCase())
    || report.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={22} className="text-brand-400" /> Reports
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate and download reports from workspace datasets</p>
        </div>
        <button onClick={() => setCreating((value) => !value)} className="btn-primary flex items-center gap-2">
          {creating ? <X size={16} /> : <Plus size={16} />}{creating ? 'Cancel' : 'New Report'}
        </button>
      </div>

      {creating && (
        <form onSubmit={createReport} className="card p-5 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Report name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} className="input w-full" placeholder="Monthly sales summary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Dataset</label>
            <select value={datasetId} onChange={(event) => setDatasetId(event.target.value)} required className="input w-full" disabled={!datasets.length}>
              {datasets.length === 0 && <option value="">Upload a ready dataset first</option>}
              {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="input w-full" placeholder="Optional summary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Download format</label>
            <select value={format} onChange={(event) => setFormat(event.target.value as 'pdf' | 'csv' | 'xlsx')} className="input w-full">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={generating || !datasets.length} className="btn-primary disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate and Download'}
            </button>
          </div>
        </form>
      )}

      <div className="card p-4 flex items-center gap-3 w-full max-w-sm">
        <Search size={15} className="text-slate-500" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none flex-1" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading reports...</p>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => void load()} className="btn-secondary btn-sm mt-3">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {search ? `No reports match "${search}".` : 'No reports yet. Generate one from a ready dataset.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Report Details</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Dataset</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Created</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filtered.map((report) => {
                  const reportDataset = datasets.find((dataset) => dataset.id === report.config?.dataset_id);
                  const StatusIcon = reportDataset ? statusIcon.ready : statusIcon.error;
                  return (
                    <tr key={report.id} className="hover:bg-dark-card/50 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{report.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{report.description || 'Dataset report'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{reportDataset?.name ?? 'Unavailable'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] ${reportDataset ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          <StatusIcon size={12} /> {reportDataset ? 'ready' : 'dataset unavailable'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{new Date(report.created_at).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => void download(report, 'pdf').catch(() => toast.error('PDF export failed.'))} disabled={!reportDataset} className="p-1.5 rounded-lg hover:bg-dark-muted text-slate-500 hover:text-brand-400 disabled:opacity-40" title="Download PDF">
                            <Download size={14} /><span className="sr-only">Download PDF</span>
                          </button>
                          <button onClick={() => void download(report, 'csv').catch(() => toast.error('CSV export failed.'))} disabled={!reportDataset} className="p-1.5 rounded-lg hover:bg-dark-muted text-slate-500 hover:text-white disabled:opacity-40" title="Download CSV">
                            <FileType size={14} /><span className="sr-only">Download CSV</span>
                          </button>
                          <button onClick={() => void download(report, 'xlsx').catch(() => toast.error('Excel export failed.'))} disabled={!reportDataset} className="p-1.5 rounded-lg hover:bg-dark-muted text-slate-500 hover:text-emerald-400 disabled:opacity-40" title="Download Excel workbook">
                            <FileSpreadsheet size={14} /><span className="sr-only">Download Excel workbook</span>
                          </button>
                          <button disabled title="Public share links are not implemented yet" className="p-1.5 rounded-lg text-slate-600 opacity-50 cursor-not-allowed">
                            <Share2 size={14} /><span className="sr-only">Share report (not available)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
