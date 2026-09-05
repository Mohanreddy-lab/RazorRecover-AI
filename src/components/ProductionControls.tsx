import React from 'react';
import { BadgeCheck, DatabaseZap, Gauge, KeyRound, Link2, LockKeyhole, ShieldAlert } from 'lucide-react';
import { AuditLedgerEntry, CircuitBreakerState, SecurityStatus } from '../types';

interface ProductionControlsProps {
  circuitBreakers: CircuitBreakerState[];
  auditLedger: AuditLedgerEntry[];
  deterministicEngine: boolean;
  securityStatus: SecurityStatus;
}

export const ProductionControls: React.FC<ProductionControlsProps> = ({ circuitBreakers, auditLedger, deterministicEngine, securityStatus }) => {
  const openCircuits = circuitBreakers.filter((circuit) => circuit.isOpen);
  const latestEntry = auditLedger[0];

  return (
    <section className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 shadow-2xl">
      <div className="mb-3 flex flex-col gap-1 border-b border-white/10 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            Production Safety Controls
          </h2>
          <p className="text-xs text-slate-400">Terminal-state verification, margin economics, circuit fast paths, and tamper-evident decisions.</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{auditLedger.length} chained decisions</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded border p-3 ${openCircuits.length ? 'border-amber-500/40 bg-amber-950/20' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="mb-2 flex items-center justify-between"><Gauge className="h-4 w-4 text-amber-400" /><span className="font-mono text-[10px] text-slate-500">3 failures / 60s</span></div>
          <div className="text-xs font-semibold uppercase text-slate-200">Bank Circuit Breaker</div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-300">{openCircuits.length ? `${openCircuits[0].bank} OPEN` : 'All routes closed'}</div>
          <p className="mt-1 text-[10px] text-slate-500">Open routes use the cached Card path immediately.</p>
        </div>

        <div className="rounded border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between"><DatabaseZap className="h-4 w-4 text-sky-400" /><span className="font-mono text-[10px] text-slate-500">2% buffer</span></div>
          <div className="text-xs font-semibold uppercase text-slate-200">Margin Guardrail</div>
          <div className="mt-1 font-mono text-sm font-bold text-sky-300">Dynamic per order</div>
          <p className="mt-1 text-[10px] text-slate-500">AI cannot grant more than margin minus the safety buffer.</p>
        </div>

        <div className="rounded border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between"><LockKeyhole className="h-4 w-4 text-emerald-400" /><span className="font-mono text-[10px] text-slate-500">HMAC + state</span></div>
          <div className="text-xs font-semibold uppercase text-slate-200">Webhook Security</div>
          <div className="mt-1 flex items-center gap-2 font-mono text-sm font-bold text-emerald-300"><span className={`h-2 w-2 rounded-full ${securityStatus.webhookSignatureConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />{securityStatus.webhookSignatureConfigured ? 'HMAC verified' : 'HMAC secret missing'}</div>
          <p className="mt-1 text-[10px] text-slate-500">{securityStatus.razorpayServerConfigured ? 'Razorpay server credentials loaded.' : 'Razorpay server credentials unavailable.'} Pending payments are checked before recovery.</p>
        </div>

        <div className="rounded border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between"><BadgeCheck className="h-4 w-4 text-violet-400" /><Link2 className="h-3.5 w-3.5 text-slate-500" /></div>
          <div className="text-xs font-semibold uppercase text-slate-200">SHA-256 Audit Chain</div>
          <div className="mt-1 truncate font-mono text-sm font-bold text-violet-300">{latestEntry ? latestEntry.hash.slice(0, 16) : 'Awaiting event'}...</div>
          <p className="mt-1 truncate text-[10px] text-slate-500">Prev: {latestEntry ? latestEntry.previousHash.slice(0, 16) : 'genesis'}...</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-white/10 pt-3 text-[10px] font-mono sm:grid-cols-3">
        <div className="rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-slate-400">LIVE STREAM <span className={securityStatus.liveStream === 'CONNECTED' ? 'text-emerald-300' : 'text-amber-300'}>{securityStatus.liveStream}</span> · {securityStatus.activeLiveSubscribers} client(s)</div>
        <div className="rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-slate-400">IDEMPOTENCY <span className="text-emerald-300">{securityStatus.idempotencyGuard}</span></div>
        <div className="rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-slate-400">AUDIT CHAIN <span className="text-violet-300">{securityStatus.auditChain}</span></div>
      </div>
    </section>
  );
};
