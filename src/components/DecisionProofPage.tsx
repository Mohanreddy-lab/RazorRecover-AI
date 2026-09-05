import React from 'react';
import { AlertTriangle, ArrowDown, CheckCircle2, FileCheck2, LockKeyhole, Route, ShieldCheck } from 'lucide-react';
import { EngineState, LivePaymentEvent } from '../types';

interface DecisionProofPageProps {
  state: EngineState | null;
  liveEvents: LivePaymentEvent[];
  onRunScenario: (scenario: string) => Promise<void>;
}

export const DecisionProofPage: React.FC<DecisionProofPageProps> = ({ state, liveEvents, onRunScenario }) => {
  const log = state?.auditLogs?.[0];
  const ledger = state?.auditLedger?.[0];
  const latestOrderId = liveEvents[0]?.orderId || log?.orderId;
  const currentEvents = liveEvents.filter((event) => !latestOrderId || event.orderId === latestOrderId);
  const processStages = [
    { stage: 'webhook', label: 'Payment failure received' },
    { stage: 'idempotency', label: 'Event identity verified' },
    { stage: 'terminal_state', label: 'Payment state checked' },
    { stage: 'reconciliation', label: 'Order reconciliation' },
    { stage: 'balance_verification', label: 'Bank balance verification' },
    { stage: 'decision', label: 'Recovery rule selected' },
    { stage: 'guardrail', label: 'Financial policy evaluated' },
    { stage: 'partial_payment', label: 'Balance protection' },
    { stage: 'action', label: 'Customer recovery prepared' }
  ];
  const latestEvent = currentEvents[0];
  const stageIndex = latestEvent && latestEvent.status !== 'complete' ? processStages.findIndex((stage) => stage.stage === latestEvent.stage) : -1;
  const runDemo = () => onRunScenario('bank_outage');
  const checks = [
    { label: 'Event identity', value: log?.eventId ? 'Unique event accepted' : 'Waiting for webhook', icon: LockKeyhole, good: Boolean(log) },
    { label: 'Order reconciliation', value: log?.failureReason === 'ALREADY_PAID' ? 'Already paid · recovery blocked' : log ? 'Unpaid · safe to continue' : 'Waiting for order state', icon: ShieldCheck, good: Boolean(log) },
    { label: 'Bank route', value: log?.bank ? `${log.bank} · ${log.errorCode || 'failure received'}` : 'Waiting for bank signal', icon: Route, good: Boolean(log) },
    { label: 'Financial policy', value: log ? `${log.discountPercent}% approved · max ${log.maxAllowedDiscount ?? 10}%` : 'Waiting for decision', icon: FileCheck2, good: Boolean(log) }
  ];

  return <div className="min-h-[calc(100vh-66px)] bg-[#f6f8fb] px-4 py-8 text-slate-950 sm:px-8 lg:py-12"><div className="mx-auto max-w-6xl">
    <div className="max-w-3xl"><span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Page 02 · transparent decision layer</span><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">See why the system made its decision.</h1><p className="mt-4 text-base leading-7 text-slate-600">This is the proof page for the demo. Every customer-facing action is backed by a payment event, a reconciliation check, a financial policy, and an immutable audit record.</p></div>
    <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={runDemo} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800">Run bank failure demo</button><span className="text-xs text-slate-500">Then return here to inspect the live evidence.</span></div>

    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{checks.map((check) => { const Icon = check.icon; return <div key={check.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{check.label}</span><Icon className={`h-5 w-5 ${check.good ? 'text-emerald-500' : 'text-slate-300'}`} /></div><p className="mt-4 text-sm font-bold text-slate-900">{check.value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{check.good ? 'Recorded in this decision trace.' : 'Run a scenario to populate proof.'}</p></div>; })}</div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><h2 className="text-base font-bold">Live decision timeline</h2></div><span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Streaming now</span></div><div className="mt-5 space-y-1">{processStages.map((stage, index) => { const event = currentEvents.find((item) => item.stage === stage.stage); const isCurrent = index === stageIndex; const isComplete = Boolean(event) && !isCurrent; const isOptional = stage.stage === 'partial_payment' && !event; const status = event?.status || (index < stageIndex ? 'complete' : 'waiting'); return <div key={stage.stage} className="relative flex gap-4 pb-4 last:pb-0">{index < processStages.length - 1 && <span className={`absolute left-[11px] top-7 h-full border-l ${isComplete ? 'border-emerald-200' : 'border-dashed border-slate-200'}`} />}<span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isCurrent ? 'animate-pulse bg-sky-500 text-white ring-4 ring-sky-100' : isComplete ? 'bg-emerald-500 text-white' : status === 'blocked' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{isComplete ? '✓' : index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-semibold ${isCurrent ? 'text-sky-700' : isComplete ? 'text-slate-800' : 'text-slate-400'}`}>{stage.label}</p><span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${isCurrent ? 'bg-sky-100 text-sky-700' : isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{isCurrent ? 'in progress' : isComplete ? 'complete' : isOptional ? 'not applicable' : 'waiting'}</span></div>{event ? <><p className="mt-1 text-xs text-slate-500">{event.detail}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</p></> : <p className="mt-1 text-xs text-slate-400">{isOptional ? 'Only used for wallet and split-payment recovery.' : 'Waiting for the previous step to finish.'}</p>}</div></div>; })}</div></section>
      <section className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl"><div className="flex items-center gap-2 border-b border-white/10 pb-4"><AlertTriangle className="h-5 w-5 text-amber-300" /><h2 className="text-base font-bold">Proof payload</h2></div><div className="mt-5 space-y-4 font-mono text-xs"><div><span className="block text-slate-500">OUTCOME</span><span className="mt-1 block text-emerald-300">{log?.actionTaken || 'Awaiting event'}</span></div><div><span className="block text-slate-500">ORDER</span><span className="mt-1 block text-slate-200">{log?.orderId || '—'}</span></div><div><span className="block text-slate-500">PROCESSING TIME</span><span className="mt-1 block text-slate-200">{log ? `${log.processingTimeMs}ms` : '—'}</span></div><div><span className="block text-slate-500">AUDIT HASH</span><span className="mt-1 block break-all text-violet-300">{ledger?.hash || log?.auditHash || 'Run a scenario to create a hash chain.'}</span></div></div><div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-400"><ArrowDown className="h-4 w-4 text-emerald-400" /> Customer sees only the safe next step.</div></section>
    </div>
  </div></div>;
};
