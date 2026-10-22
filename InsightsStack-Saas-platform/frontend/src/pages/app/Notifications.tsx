import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import { notificationService } from '@/services';

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

function errorMessage(error: unknown) {
  return isAxiosError<{ detail?: string; error?: string }>(error)
    ? error.response?.data?.detail ?? error.response?.data?.error ?? 'Could not load notifications.'
    : 'Could not load notifications.';
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationService.list();
      const payload = response.data;
      setItems(Array.isArray(payload) ? payload : payload.results ?? []);
    } catch (loadError) {
      const message = errorMessage(loadError);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (item: NotificationRecord) => {
    if (item.is_read) return;
    setSaving(true);
    try {
      await notificationService.markRead(item.id);
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, is_read: true } : entry));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (readError) {
      toast.error(errorMessage(readError));
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    try {
      await notificationService.markAllRead();
      setItems(current => current.map(item => ({ ...item, is_read: true })));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (readError) {
      toast.error(errorMessage(readError));
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = items.filter(item => !item.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">Updates for your account.</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || saving}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-400" /></div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dark-border bg-dark-surface p-12 text-center text-slate-400">
          <Bell className="mx-auto mb-3 opacity-50" size={28} />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-dark-border rounded-xl border border-dark-border bg-dark-surface">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => void markRead(item)}
              disabled={saving}
              className="flex w-full items-start gap-4 p-4 text-left hover:bg-dark-card/50 disabled:cursor-default"
            >
              <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${item.is_read ? 'bg-slate-600' : 'bg-brand-400'}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {item.title}
                  <span className="rounded bg-dark-card px-1.5 py-0.5 text-[10px] text-slate-400">
                    {item.notification_type.replaceAll('_', ' ')}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-slate-400">{item.message}</span>
                <span className="mt-2 block text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
