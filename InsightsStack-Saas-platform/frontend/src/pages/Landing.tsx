import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight, Check, Zap, Shield, TrendingUp, Users, Globe, Cpu } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Real-Time Dashboards', desc: 'Drag-and-drop widgets with live data refresh. See your KPIs update as they happen.' },
  { icon: Cpu, title: 'AI-Powered Insights', desc: 'Groq-powered AI analyzes your data and surfaces actionable insights automatically.' },
  { icon: Users, title: 'Multi-Tenant Teams', desc: 'Role-based access control with granular permissions for every workspace.' },
  { icon: Globe, title: 'Multi-Source Data', desc: 'Import CSV, Excel, or JSON. Connect to databases and cloud storage.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, MFA, audit logs, and SOC2-ready data handling.' },
  { icon: Zap, title: 'Instant Reports', desc: 'Schedule PDF/Excel reports and share with a single link.' },
];

const plans = [
  { name: 'Starter', price: '$29', period: '/mo', features: ['5 Dashboards', '10 Datasets', '3 Users', 'Email Support'], cta: 'Start Free Trial', highlight: false },
  { name: 'Pro', price: '$99', period: '/mo', features: ['Unlimited Dashboards', '100 Datasets', '20 Users', 'AI Insights', 'Priority Support'], cta: 'Start Free Trial', highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'SSO & MFA', 'Audit Logs', 'SLA', 'Dedicated Manager'], cta: 'Contact Sales', highlight: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">InsightStack</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-8 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand-500/12 rounded-full blur-3xl" />
          <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8">
            <Zap size={14} />
            Powered by Groq
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Transform Data Into{' '}
            <span className="gradient-text">Actionable Insights</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            The enterprise analytics platform with real-time dashboards, AI-powered insights, and role-based reporting — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">
              View Demo
            </Link>
          </div>
          <p className="text-sm text-slate-600 mt-4">No credit card required · 14-day free trial</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-dark-border bg-dark-surface/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center">
          {[['2,400+', 'Companies'], ['$4.2B', 'Data Analyzed'], ['99.9%', 'Uptime SLA'], ['< 500ms', 'Avg. Load Time']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold gradient-text mb-1">{val}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to move fast</h2>
          <p className="text-slate-400 max-w-xl mx-auto">From raw data imports to executive dashboards and AI insights — InsightStack handles the full analytics lifecycle.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:border-brand-500/40 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
                <Icon size={18} className="text-brand-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 bg-dark-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400">Scale from startup to enterprise without surprises.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`card p-8 flex flex-col gap-6 ${plan.highlight ? 'border-brand-500/50 bg-brand-500/5 shadow-glow' : ''}`}>
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-medium w-fit">
                    <Zap size={11} /> Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={plan.highlight ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Join thousands of businesses turning data into growth.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-3 inline-flex">
            Start Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-8 text-center text-sm text-slate-600">
        © 2026 InsightStack. Built with React, Django &amp; Groq AI.
      </footer>
    </div>
  );
}
