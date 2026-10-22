import { useCallback, useEffect, useState } from 'react';
import { Database, Eye, FileText, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { datasetService } from '@/services';
import { useWorkspaceStore } from '@/store';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

interface Dataset {
  id: string;
  name: string;
  row_count: number;
  columns: { name: string; type: string }[];
  file_type: string;
  status: 'ready' | 'processing' | 'error';
  error_message: string;
  created_at: string;
  preview: Record<string, unknown>[];
}

const statusStyle: Record<Dataset['status'], string> = {
  ready: 'badge-success',
  processing: 'badge-warning',
  error: 'badge-error',
};

const typeIcon: Record<string, string> = { csv: 'CSV', excel: 'XLSX', json: 'JSON' };

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Dataset | null>(null);
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);

  const loadDatasets = useCallback(async () => {
    if (!workspaceId) {
      setDatasets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await datasetService.list(workspaceId);
      setDatasets(response.data);
    } catch {
      setError('Datasets could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadDatasets();
  }, [loadDatasets]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!workspaceId) {
      toast.error('Choose a workspace before uploading a dataset.');
      return;
    }
    const accepted = Array.from(files);
    if (!accepted.length) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of accepted) {
        try {
          const response = await datasetService.upload(workspaceId, file, file.name);
          if (response.data.status === 'ready') {
            uploaded += 1;
          } else {
            toast.error(`${file.name}: ${response.data.error_message || 'Import failed.'}`);
          }
        } catch (uploadError) {
          const message = isAxiosError(uploadError)
            ? uploadError.response?.data?.file?.[0] ?? uploadError.response?.data?.workspace?.[0] ?? 'Upload failed.'
            : 'Upload failed.';
          toast.error(`${file.name}: ${message}`);
        }
      }
      if (uploaded) toast.success(`${uploaded} dataset${uploaded === 1 ? '' : 's'} imported.`);
      if (accepted.length) window.dispatchEvent(new Event('notifications:changed'));
      await loadDatasets();
    } finally {
      setUploading(false);
    }
  };

  const removeDataset = async (dataset: Dataset) => {
    try {
      await datasetService.delete(dataset.id);
      setDatasets((items) => items.filter((item) => item.id !== dataset.id));
      if (selected?.id === dataset.id) setSelected(null);
      toast.success('Dataset deleted.');
    } catch {
      toast.error('Dataset could not be deleted.');
    }
  };

  const showPreview = async (dataset: Dataset) => {
    try {
      const response = await datasetService.get(dataset.id);
      setSelected(response.data);
    } catch {
      toast.error('Dataset preview could not be loaded.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database size={22} className="text-brand-400" /> Datasets
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Import and manage workspace data sources</p>
      </div>

      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all duration-200',
          dragging ? 'border-brand-500 bg-brand-500/8 scale-[1.01]' : 'border-dark-border hover:border-brand-500/40 hover:bg-dark-card/50',
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
          <Upload size={24} className="text-brand-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">{uploading ? 'Importing dataset...' : 'Drop files here to import'}</p>
          <p className="text-slate-500 text-sm mt-1">CSV, Excel (.xlsx), or JSON · Maximum file size 25 MB</p>
        </div>
        <label className={clsx('btn-primary btn-sm', uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer')}>
          <FileText size={14} /> Browse Files
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.json"
            multiple
            disabled={uploading}
            onChange={(event) => {
              if (event.target.files) void uploadFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-white font-semibold">Imported Datasets</h2>
          <div className="flex items-center gap-3">
            <span className="badge-muted">{datasets.length} files</span>
            <button onClick={() => void loadDatasets()} className="text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading datasets...</p>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => void loadDatasets()} className="btn-secondary btn-sm mt-3">Retry</button>
          </div>
        ) : datasets.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No datasets in this workspace yet. Upload a CSV, XLSX, or JSON file to get started.</p>
        ) : (
          <div className="divide-y divide-dark-border">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="flex items-center gap-4 px-5 py-4 hover:bg-dark-card/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-dark-muted flex items-center justify-center text-[10px] font-bold text-brand-300 flex-shrink-0">
                  {typeIcon[dataset.file_type] ?? 'FILE'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{dataset.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dataset.row_count.toLocaleString()} rows · {dataset.columns.length} columns
                  </p>
                  {dataset.status === 'error' && <p className="text-xs text-red-400 mt-1">{dataset.error_message}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`badge text-[10px] ${statusStyle[dataset.status]}`}>{dataset.status}</span>
                  <span className="text-xs text-slate-600 hidden md:block">{new Date(dataset.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => void showPreview(dataset)} title="Preview dataset" className="p-1.5 rounded-lg hover:bg-dark-muted text-slate-500 hover:text-brand-400">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => void removeDataset(dataset)} title="Delete dataset" className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <section className="card w-full max-w-5xl max-h-[85vh] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <div>
                <h2 className="text-white font-semibold">{selected.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{selected.row_count.toLocaleString()} rows · {selected.columns.length} columns</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white" aria-label="Close preview"><X size={18} /></button>
            </div>
            <div className="overflow-auto max-h-[65vh] p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dark-border">
                    {selected.columns.map((column) => <th key={column.name} className="text-left text-slate-400 font-medium px-3 py-2">{column.name}<span className="block text-slate-600 font-normal">{column.type}</span></th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {selected.preview.map((row, index) => (
                    <tr key={index}>
                      {selected.columns.map((column) => <td key={column.name} className="px-3 py-2 text-slate-300 whitespace-nowrap">{String(row[column.name] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!selected.preview.length && <p className="text-center text-slate-500 p-6">This dataset has no preview rows.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
