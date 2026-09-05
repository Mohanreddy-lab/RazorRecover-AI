import React from 'react';
import { Activity, ArrowRight, Banknote, CheckCircle2, LockKeyhole, ShieldCheck, Zap } from 'lucide-react';
import { SystemMetrics } from '../types';

interface HomePageProps {
  metrics: SystemMetrics;
  onNavigate: (view: 'customer' | 'proof' | 'merchant' | 'admin') => void;
}

const features = [
  { icon: ShieldCheck, title: 'Double-charge prevention', detail: 'Order state, terminal status, and idempotency checks stop unsafe retries.' },
  { icon: Banknote, title: 'Bank outage routing', detail: 'Detect degraded bank routes and move customers to a safer fallback method.' },
  { icon: Zap, title: 'Smart recovery actions', detail: 'Choose retry, hold, partial recovery, mandate upgrade, or currency routing.' },
  { icon: LockKeyhole, title: 'Margin guardrails', detail: 'Discounts follow category margin policy and never exceed the hard cap.' },
  { icon: Activity, title: 'Real-time monitoring', detail: 'SSE events stream each webhook, decision, lock, guardrail, and action.' },
  { icon: CheckCircle2, title: 'Tamper-evident proof', detail: 'Every decision receives a chained SHA-256 audit record for review.' }
];

export const HomePage: React.FC<HomePageProps> = ({ metrics, onNavigate }) => (
  <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.22),transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#082f49)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live resilience engine</div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">RazorRecover AI</h1>
          <p className="mt-4 max-w-2xl text-xl leading-8 text-sky-100">Recover failed payments, prevent double charges, and protect merchant revenue with explainable payment decisions.</p>
          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">A deterministic Razorpay resilience layer that watches payment state in real time, applies financial guardrails, and shows exactly why every recovery action was selected.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('merchant')} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-400">Open merchant dashboard <ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => onNavigate('admin')} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Open admin console</button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">System promise</p><p className="mt-1 text-lg font-bold text-white">Safe action before fast action</p></div><ShieldCheck className="h-8 w-8 text-emerald-400" /></div>
          {['Receive the payment event', 'Verify state and order ownership', 'Apply bank, circuit, and margin rules', 'Recover, hold, or halt with proof'].map((step, index) => <div key={step} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400/15 font-mono text-xs font-bold text-sky-300">0{index + 1}</span><span className="text-sm text-slate-200">{step}</span></div>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
      ['Recovered revenue', metrics.recoveredRevenueFormatted], ['Webhooks processed', metrics.totalWebhooks.toLocaleString('en-IN')], ['Double charges blocked', metrics.doubleChargesPrevented.toString()], ['Guardrails enforced', metrics.guardrailsEnforced.toString()]
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-[11px] text-emerald-300">Live from engine state</p></div>)}</div></section>

    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">What the platform proves</p><h2 className="mt-2 text-2xl font-bold text-white">Payment resilience built for real failure states</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, detail }) => <article key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-sky-400/40 hover:bg-white/[0.07]"><Icon className="h-5 w-5 text-sky-300" /><h3 className="mt-4 text-sm font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p></article>)}</div></section>
  </main>
);
