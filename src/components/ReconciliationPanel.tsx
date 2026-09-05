import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { ReconciliationRun, ReconciliationScenario, ReconciliationState } from '../types';

interface ReconciliationPanelProps {
  state: ReconciliationState;
  onRun: (scenario: ReconciliationScenario) => Promise<ReconciliationRun>;
}

const scenarios: Array<{ id: ReconciliationScenario; title: string; description: string; icon: typeof CheckCircle2 }> = [
  { id: 'missed_webhook', title: 'Missed webhook', description: 'Find a captured Razorpay payment and mark the pending merchant order PAID.', icon: CheckCircle2 },
  { id: 'amount_mismatch', title: 'Amount mismatch', description: 'Hold fulfillment when the captured amount is lower than the order total.', icon: AlertTriangle },
  { id: 'duplicate_payment', title: 'Duplicate payment', description: 'Keep the first capture and initiate a refund for the second capture.', icon: RotateCcw }
];

export const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({ state, onRun }) => {
  const [running, setRunning] = useState<ReconciliationScenario | null>(null);
  const latestRun = state.runs[0];
  const latestRecord = latestRun?.records[0];

  const runScenario = async (scenario: ReconciliationScenario) => {
    setRunning(scenario);
    try { await onRun(scenario); } finally { setRunning(null); }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 shadow-2xl">
      <div className="mb-3 flex flex-col gap-1 border-b border-white/10 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white"><RefreshCw className="h-4 w-4 text-sky-400" /> Auto-Reconcile Agent</h2>
          <p className="text-xs text-slate-400">Every run matches captured payments against merchant orders before fulfillment.</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Deterministic 5-minute poll simulation</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isRunning = running === scenario.id;
          return <button key={scenario.id} onClick={() => runScenario(scenario.id)} disabled={Boolean(running)} className="rounded border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-sky-400/50 hover:bg-sky-950/20 disabled:opacity-50">
            <div className="mb-2 flex items-center justify-between"><Icon className="h-4 w-4 text-sky-400" /><span className="font-mono text-[10px] text-slate-500">{isRunning ? 'RUNNING' : 'SIMULATE'}</span></div>
            <div className="text-xs font-semibold uppercase text-slate-100">{scenario.title}</div>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{scenario.description}</p>
          </button>;
        })}
      </div>

      {latestRecord ? <div className="mt-3 grid grid-cols-1 gap-3 border-t border-white/10 pt-3 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider ${latestRecord.status === 'RECONCILED' ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300' : latestRecord.status === 'UNDERPAID' ? 'border-amber-500/30 bg-amber-950/40 text-amber-300' : 'border-violet-500/30 bg-violet-950/40 text-violet-300'}`}>{latestRecord.status}</span><span className="font-mono text-[11px] text-white">{latestRecord.orderId}</span></div>
          <p className="mt-2 text-xs text-slate-300">{latestRecord.merchantNotification}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">Action: {latestRecord.action}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right font-mono text-[11px]">
          <div><span className="block text-[9px] uppercase text-slate-600">Expected</span><span className="text-slate-200">₹{(latestRecord.expectedAmountPaise / 100).toFixed(2)}</span></div>
          <div><span className="block text-[9px] uppercase text-slate-600">Received</span><span className="text-slate-200">₹{(latestRecord.receivedAmountPaise / 100).toFixed(2)}</span></div>
          <div><span className="block text-[9px] uppercase text-slate-600">Run time</span><span className="text-sky-300">{latestRun.durationMs}ms</span></div>
        </div>
      </div> : <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> No reconciliation run yet.</div>}

      <div className="mt-3 flex flex-wrap gap-3 border-t border-white/10 pt-3 font-mono text-[10px] text-slate-500">
        <span><ShieldCheck className="mr-1 inline h-3 w-3 text-emerald-400" />{state.runs.filter((run) => run.summary.reconciled).length} orders reconciled</span>
        <span><AlertTriangle className="mr-1 inline h-3 w-3 text-amber-400" />{state.runs.filter((run) => run.summary.mismatches).length} mismatches held</span>
        <span><RotateCcw className="mr-1 inline h-3 w-3 text-violet-400" />{state.runs.reduce((sum, run) => sum + run.summary.duplicatesRefunded, 0)} duplicate refunds</span>
      </div>
    </section>
  );
};
