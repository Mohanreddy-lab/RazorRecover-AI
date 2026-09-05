import React from 'react';
import { ShieldCheck, Zap, Activity, RefreshCw, FileCode, Send, CheckCircle2 } from 'lucide-react';
import { SystemMetrics } from '../types';

interface HeaderProps {
  metrics: SystemMetrics;
  isProcessing: boolean;
  onReset: () => void;
  onOpenCode: () => void;
  onOpenCustomWebhook: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  isProcessing,
  onReset,
  onOpenCode,
  onOpenCustomWebhook
}) => {
  return (
    <header className="border-b border-white/10 bg-[#050505]/95 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-md bg-emerald-500 flex items-center justify-center font-bold text-black text-xs shadow-[0_0_14px_rgba(16,185,129,0.35)] shrink-0">
            <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-medium tracking-tight uppercase text-white font-sans">
                RazorRecover <span className="text-emerald-400 font-bold">AI</span>
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold bg-white/5 text-slate-300 border border-white/10">
                Track 3: AI Revenue Recovery
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] tracking-wider uppercase font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_8px_#10b981] animate-pulse" />
                Live Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Autonomous Razorpay failure triage • Deterministic rules • Financial guardrails (≤10%) • Idempotency lock
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-custom-webhook"
            onClick={onOpenCustomWebhook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10"
          >
            <Send className="w-3.5 h-3.5 text-slate-400" />
            Raw Webhook
          </button>

          <button
            id="btn-submission-code"
            onClick={onOpenCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/30"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            Python & Docs
          </button>

          <button
            id="btn-reset-data"
            onClick={onReset}
            disabled={isProcessing}
            title="Reset to initial test state"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            Reset State
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="border-t border-white/10 bg-[#080808]/90 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Total Webhooks</span>
              <span className="font-mono font-semibold text-white">{metrics.totalWebhooks} events</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Recovered Revenue</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{metrics.recoveredRevenueFormatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Double Charges Blocked</span>
              <span className="font-mono font-semibold text-amber-300">{metrics.doubleChargesPrevented} prevented</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Bank Outages Mitigated</span>
              <span className="font-mono font-semibold text-sky-300">{metrics.outagesMitigated} routed</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#10b981]" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-medium">Guardrails Enforced</span>
              <span className="font-mono font-semibold text-emerald-300">{metrics.guardrailsEnforced} clamped (≤10%)</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
