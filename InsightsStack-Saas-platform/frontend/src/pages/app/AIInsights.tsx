import { useEffect, useState } from 'react';
import { Bot, Lightbulb, Send, Sparkles } from 'lucide-react';
import { isAxiosError } from 'axios';
import { aiService } from '@/services';
import { useWorkspaceStore } from '@/store';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'ai' | 'error';
  text: string;
}

export default function AIInsights() {
  const workspace = useWorkspaceStore((state) => state.currentWorkspace);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Ask a question about the KPIs and datasets in your selected workspace.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [insightsRetry, setInsightsRetry] = useState(0);

  useEffect(() => {
    setConversationId(undefined);
    setMessages([{ role: 'ai', text: 'Ask a question about the KPIs and datasets in your selected workspace.' }]);
    setInsights('');
  }, [workspace?.id]);

  useEffect(() => {
    setInsightsError('');
    if (!workspace?.id) {
      setInsightsLoading(false);
      return;
    }

    let active = true;
    setInsightsLoading(true);
    aiService.getInsights(workspace.id)
      .then(({ data }) => {
        if (active) setInsights(data.insights);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setInsights('');
        const message = isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined;
        setInsightsError(message ?? 'Could not reach the AI insights service. Check the backend connection and retry.');
      })
      .finally(() => {
        if (active) setInsightsLoading(false);
      });
    return () => { active = false; };
  }, [insightsRetry, workspace?.id]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    if (!workspace?.id) {
      toast.error('Select a workspace before asking a question.');
      return;
    }
    setMessages((current) => [...current, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await aiService.query(question, workspace.id, conversationId);
      setConversationId(data.conversation_id);
      setMessages((current) => [...current, { role: 'ai', text: data.response }]);
    } catch (error) {
      const message = (isAxiosError<{ error?: string }>(error) && error.response?.data?.error)
        || 'AI analytics is unavailable. Please try again.';
      setMessages((current) => [...current, { role: 'error', text: message }]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles size={22} className="text-brand-400" /> AI Insights
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Answers use authorized data from {workspace?.name ?? 'your workspace'}</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 card flex flex-col" style={{ height: '70vh' }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-border flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">InsightStack AI</p>
              <p className="text-[11px] text-slate-400">Groq · workspace-scoped context</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : message.role === 'error'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
                      : 'bg-dark-card border border-dark-border text-slate-300 rounded-bl-sm'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-500">Analyzing workspace data…</p>}
          </div>

          <div className="px-4 py-3 border-t border-dark-border flex-shrink-0">
            <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-4 py-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
                placeholder="Ask about your dataset or KPIs..."
                className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
                disabled={loading || !workspace}
              />
              <button onClick={() => void send()} disabled={loading || !input.trim() || !workspace} className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40" aria-label="Send question">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={16} className="text-amber-400" />
            <h2 className="text-white font-semibold text-sm">Workspace insights</h2>
          </div>
          <div className="rounded-xl p-4 border border-brand-500/20 bg-brand-500/5 min-h-32">
            {insightsLoading ? (
              <p className="text-sm text-slate-400">Generating insights from workspace data…</p>
            ) : insights ? (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{insights}</p>
            ) : insightsError ? (
              <div>
                <p role="alert" className="text-sm text-red-300">{insightsError}</p>
                <button
                  onClick={() => setInsightsRetry((attempt) => attempt + 1)}
                  className="btn-secondary btn-sm mt-3"
                  disabled={!workspace}
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Add a dataset or KPI to generate workspace insights.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
