import React from 'react';
import { ArrowRight, Banknote, BellRing, CheckCircle2, ClipboardCheck, DatabaseZap, ShieldCheck } from 'lucide-react';

const steps = [
  { label: 'Payment attempt', detail: 'Customer checks out through Razorpay.', icon: Banknote, color: 'text-sky-300 border-sky-400/30 bg-sky-950/20' },
  { label: 'Webhook received', detail: 'The engine verifies the event and payment state.', icon: BellRing, color: 'text-amber-300 border-amber-400/30 bg-amber-950/20' },
  { label: 'Safety checks', detail: 'Idempotency, reconciliation, circuit, and margin rules run first.', icon: ShieldCheck, color: 'text-emerald-300 border-emerald-400/30 bg-emerald-950/20' },
  { label: 'Decision', detail: 'Retry, alternate checkout, hold, or halt duplicate payment.', icon: ClipboardCheck, color: 'text-violet-300 border-violet-400/30 bg-violet-950/20' },
  { label: 'Customer update', detail: 'WhatsApp and checkout state update immediately.', icon: BellRing, color: 'text-cyan-300 border-cyan-400/30 bg-cyan-950/20' },
  { label: 'Reconciled result', detail: 'The order is paid, held, refunded, or safely closed.', icon: DatabaseZap, color: 'text-lime-300 border-lime-400/30 bg-lime-950/20' }
];

export const SystemHowItWorks: React.FC = () => (
  <section className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 shadow-2xl">
    <div className="mb-3 flex flex-col gap-1 border-b border-white/10 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">How the system works</h2>
        <p className="text-xs text-slate-400">One payment event moves through protection, decision, customer action, and reconciliation.</p>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">Customer + merchant loop</span>
    </div>

    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return <React.Fragment key={step.label}>
          <div className={`relative rounded border p-3 ${step.color}`}>
            <div className="mb-2 flex items-center justify-between"><Icon className="h-4 w-4" /><span className="font-mono text-[10px] opacity-60">0{index + 1}</span></div>
            <div className="text-xs font-semibold uppercase leading-tight">{step.label}</div>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">{step.detail}</p>
          </div>
          {index < steps.length - 1 && <ArrowRight className="hidden self-center text-slate-700 lg:block" />}
        </React.Fragment>;
      })}
    </div>
  </section>
);

export const CustomerSideDemo: React.FC<{ hasSession: boolean; orderStatus?: string }> = ({ hasSession, orderStatus }) => (
  <section className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-4 shadow-2xl">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded border border-emerald-400/30 bg-emerald-400/10 p-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" /></div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Customer-side demo</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">Run a failure scenario below, then use the WhatsApp message and secure checkout on the right to complete the purchase as the customer. The operator dashboard updates at the same time.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-right font-mono text-[10px]">
        <div className="rounded border border-white/10 bg-black/20 px-3 py-2"><span className="block text-slate-500">CUSTOMER SESSION</span><span className={hasSession ? 'text-emerald-300' : 'text-slate-400'}>{hasSession ? 'RECOVERY READY' : 'WAITING FOR FAILURE'}</span></div>
        <div className="rounded border border-white/10 bg-black/20 px-3 py-2"><span className="block text-slate-500">ORDER STATE</span><span className="text-sky-300">{orderStatus ? orderStatus.toUpperCase() : 'NOT STARTED'}</span></div>
      </div>
    </div>
  </section>
);
