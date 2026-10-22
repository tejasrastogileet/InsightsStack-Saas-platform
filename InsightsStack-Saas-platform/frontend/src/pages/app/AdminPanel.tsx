import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Users } from 'lucide-react';
import { isAxiosError } from 'axios';
import { subscriptionService } from '@/services';
import { useWorkspaceStore } from '@/store';

interface Plan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: string;
  max_users: number;
  max_workspaces: number;
  max_dashboards: number;
  features: string[];
}

interface Subscription {
  status: string;
  plan: Plan;
  current_period_end: string;
}

function getError(error: unknown) {
  return isAxiosError<{ error?: string; detail?: string }>(error)
    ? error.response?.data?.error ?? error.response?.data?.detail ?? 'Subscription details could not be loaded.'
    : 'Subscription details could not be loaded.';
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const organization = useWorkspaceStore(state => state.currentOrg);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const plansResponse = await subscriptionService.getPlans();
        if (active) setPlans(plansResponse.data);
        if (organization?.id) {
          try {
            const subscriptionResponse = await subscriptionService.getCurrent(organization.id);
            if (active) setSubscription(subscriptionResponse.data);
          } catch (subscriptionError) {
            if (active && !(isAxiosError(subscriptionError) && subscriptionError.response?.status === 404)) {
              setError(getError(subscriptionError));
            }
            if (active) setSubscription(null);
          }
        } else if (active) {
          setSubscription(null);
        }
      } catch (loadError) {
        if (active) setError(getError(loadError));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [organization?.id]);

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={22} className="text-brand-400" /> Subscription
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{organization?.name ?? 'Select an organization to view its subscription.'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-400" /></div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">{error}</div>
      ) : (
        <>
          <section className="card p-6">
            <h2 className="text-white font-semibold mb-4">Current plan</h2>
            {subscription ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{subscription.plan.display_name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {subscription.status} · ${Number(subscription.plan.price_monthly).toLocaleString()}/month
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Current period ends {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                </div>
                <span className="badge-success">{subscription.status}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No subscription is configured for this organization.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-white font-semibold mb-5">Available plans</h2>
            {plans.length === 0 ? (
              <p className="text-sm text-slate-400">No active plans are configured.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map(plan => {
                  const current = subscription?.plan.id === plan.id;
                  return (
                    <article key={plan.id} className={`rounded-xl p-5 border ${current ? 'border-brand-500/50 bg-brand-500/8' : 'border-dark-border bg-dark-card'}`}>
                      {current && <span className="badge-primary mb-3 inline-flex">Current plan</span>}
                      <h3 className="text-white font-bold text-lg">{plan.display_name}</h3>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        ${Number(plan.price_monthly).toLocaleString()}<span className="text-sm text-slate-500 font-normal">/mo</span>
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2"><Users size={13} className="text-brand-400" /> {plan.max_users < 0 ? 'Unlimited' : plan.max_users} users</li>
                        <li className="flex items-center gap-2"><Check size={13} className="text-emerald-400" /> {plan.max_workspaces < 0 ? 'Unlimited' : plan.max_workspaces} workspaces</li>
                        <li className="flex items-center gap-2"><Check size={13} className="text-emerald-400" /> {plan.max_dashboards < 0 ? 'Unlimited' : plan.max_dashboards} dashboards</li>
                        {plan.features.map(feature => <li key={feature} className="flex items-center gap-2"><Check size={13} className="text-emerald-400" /> {feature}</li>)}
                      </ul>
                      <button
                        disabled
                        title="Billing changes are disabled until a payment provider is configured."
                        className="btn-secondary w-full mt-4 text-xs justify-center opacity-50 cursor-not-allowed"
                      >
                        {current ? 'Current plan' : 'Billing unavailable'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-semibold">Organization members</h2>
              <p className="mt-1 text-sm text-slate-400">Manage member access and roles in your organization.</p>
            </div>
            <button onClick={() => navigate('/app/organization')} className="btn-secondary flex items-center gap-2">
              <Users size={15} /> Manage team
            </button>
          </section>
        </>
      )}
    </div>
  );
}
