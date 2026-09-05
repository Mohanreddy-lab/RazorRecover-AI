import React from 'react';
import { Radio, Lock, SearchCheck, Cpu, ShieldAlert, Smartphone } from 'lucide-react';
import { WebhookAuditLog } from '../types';

interface PipelineVisualizerProps {
  latestLog: WebhookAuditLog | null;
  isProcessing: boolean;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ latestLog, isProcessing }) => {
  const steps = [
    {
      id: 'webhook',
      title: '1. Razorpay Webhook',
      subtitle: latestLog ? `${latestLog.bank || 'UPI'} • ${latestLog.errorCode || 'EVENT'}` : 'Listening on /webhook',
      icon: Radio,
      status: isProcessing ? 'active' : latestLog ? 'completed' : 'idle',
      color: 'blue'
    },
    {
      id: 'idempotency',
      title: '2. Event Idempotency',
      subtitle: latestLog ? (latestLog.isDuplicateEvent ? 'Duplicate Suppressed' : 'Unique Event Verified') : 'Deduplication Cache',
      icon: Lock,
      status: isProcessing ? 'active' : latestLog ? (latestLog.isDuplicateEvent ? 'warning' : 'completed') : 'idle',
      color: 'indigo'
    },
    {
      id: 'reconciliation',
      title: '3. Live Order Check',
      subtitle: latestLog ? (latestLog.failureReason === 'ALREADY_PAID' ? 'PAID in DB (Halt!)' : latestLog.failureReason === 'GHOST_PROCESSING' ? 'Verification lock active' : 'Unsettled (Safe to act)') : 'Double-Charge Guard',
      icon: SearchCheck,
      status: isProcessing ? 'active' : latestLog?.failureReason === 'ALREADY_PAID' ? 'halted' : latestLog?.failureReason === 'GHOST_PROCESSING' ? 'warning' : latestLog ? 'completed' : 'idle',
      color: 'amber'
    },
    {
      id: 'rules',
      title: '4. Rule Engine',
      subtitle: latestLog ? `${latestLog.failureReason} (${latestLog.aiModel || 'Deterministic'})` : 'Deterministic Failure Triage',
      icon: Cpu,
      status: isProcessing ? 'active' : latestLog?.failureReason === 'ALREADY_PAID' ? 'skipped' : latestLog ? 'completed' : 'idle',
      color: 'purple'
    },
    {
      id: 'guardrail',
      title: '5. Deterministic Guardrails',
      subtitle: latestLog ? (latestLog.guardrailClamped ? 'CLAMPED: Capped at 10%' : `${latestLog.discountPercent}% Discount Authorized`) : 'Strict ≤10% Policy',
      icon: ShieldAlert,
      status: isProcessing ? 'active' : latestLog?.guardrailClamped ? 'clamped' : latestLog ? 'completed' : 'idle',
      color: 'rose'
    },
    {
      id: 'action',
      title: '6. Action & Dispatch',
      subtitle: latestLog ? (
        latestLog.actionTaken === 'HALT_ALREADY_PAID' ? 'Recovery Suppressed' :
        latestLog.actionTaken === 'HOLD_AND_POLL_VERIFY' ? '15-minute verification hold' :
        latestLog.actionTaken === 'GENERATE_PARTIAL_RECOVERY_LINK' ? 'Remaining balance link ready' :
        latestLog.actionTaken === 'SPLIT_MANDATE_OR_UPGRADE_LINK' ? '2FA top-up / mandate upgrade' :
        latestLog.actionTaken === 'DYNAMIC_CURRENCY_ROUTING' ? 'FX-protected international route' :
        'WhatsApp Link Ready'
      ) : 'WhatsApp + Card Fallback',
      icon: Smartphone,
      status: isProcessing ? 'active' : latestLog?.actionTaken === 'HALT_ALREADY_PAID' ? 'halted' : latestLog?.actionTaken === 'HOLD_AND_POLL_VERIFY' ? 'warning' : latestLog ? 'completed' : 'idle',
      color: 'emerald'
    }
  ];

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white">
            Real-Time Payment Resilience Pipeline
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {latestLog ? `Last Event: ${latestLog.orderId} (${latestLog.processingTimeMs}ms)` : 'Ready for webhook input'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          let badgeColor = 'bg-white/5 text-slate-400 border-white/10';
          let borderStyle = 'border-white/10 bg-white/[0.02]';

          if (step.status === 'active') {
            badgeColor = 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40 animate-pulse';
            borderStyle = 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
          } else if (step.status === 'completed') {
            badgeColor = 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30';
            borderStyle = 'border-emerald-500/30 bg-emerald-950/10';
          } else if (step.status === 'halted') {
            badgeColor = 'bg-amber-950/40 text-amber-300 border-amber-500/30 font-semibold';
            borderStyle = 'border-amber-500/30 bg-amber-950/20';
          } else if (step.status === 'warning') {
            badgeColor = 'bg-amber-950/40 text-amber-200 border-amber-400/50 font-semibold';
            borderStyle = 'border-amber-400/40 bg-amber-950/20 ring-1 ring-amber-500/20';
          } else if (step.status === 'clamped') {
            badgeColor = 'bg-rose-950/40 text-rose-300 border-rose-500/30 font-semibold';
            borderStyle = 'border-rose-500/30 bg-rose-950/20';
          } else if (step.status === 'skipped') {
            badgeColor = 'bg-white/5 text-slate-600 border-white/5';
            borderStyle = 'border-white/5 bg-transparent opacity-40';
          }

          return (
            <div
              key={step.id}
              className={`p-3 rounded border text-left transition-all ${borderStyle} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded ${badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                    {step.status}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-100 leading-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-snug line-clamp-2">
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
