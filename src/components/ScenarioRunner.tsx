import React from 'react';
import { Play, AlertTriangle, ShieldCheck, ShieldAlert, SplitSquareVertical, Wallet, Gauge, BadgeIndianRupee, Clock3, Coins, Repeat2, Globe2 } from 'lucide-react';

interface ScenarioRunnerProps {
  onRunScenario: (scenarioId: string) => void;
  isProcessing: boolean;
  activeScenario: string | null;
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  onRunScenario,
  isProcessing,
  activeScenario
}) => {
  const scenarios = [
    {
      id: 'bank_outage',
      title: 'Hero 1: Bank Outage Recovery',
      badge: 'Main Feature',
      badgeColor: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      description: 'HDFC UPI gateway times out. The rule engine diagnoses the outage, avoids the failing route, and generates a Card fallback link with an authorized 5% discount.',
      tag: 'HDFC • GATEWAY_TIMEOUT → Card + 5% Off'
    },
    {
      id: 'already_paid',
      title: 'Hero 2: Double-Charge Guard',
      badge: '#1 Production Bug',
      badgeColor: 'bg-sky-950/50 text-sky-400 border-sky-500/30',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      description: 'Delayed payment.failed webhook arrives after order was already settled. Engine reconciles state, suppresses recovery (HALT_ALREADY_PAID), and prevents duplicate charge.',
      tag: 'Order Paid → HALT_ALREADY_PAID'
    },
    {
      id: 'guardrail_attack',
      title: 'Hero 3: Guardrail Attack Intercept',
      badge: 'Safety Proof',
      badgeColor: 'bg-rose-950/50 text-rose-400 border-rose-500/30',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      description: 'Simulates a prompt injection payload demanding a 50% discount. Deterministic code clamps the discount strictly to the 10.0% policy ceiling and records a security audit event.',
      tag: '50% Injected → Clamped to 10.0% Max'
    },
    {
      id: 'twotab_order_payment',
      title: 'Hero 4: Two-Tab Idempotency',
      badge: 'Live Invalidation',
      badgeColor: 'bg-purple-950/50 text-purple-400 border-purple-500/30',
      icon: SplitSquareVertical,
      iconColor: 'text-purple-400',
      description: 'Customer has both original checkout and recovery link open. Mark original order paid — watch competing recovery session instantly die live in real-time!',
      tag: 'Original Paid → Kill Recovery Session'
    },
    {
      id: 'user_balance_error',
      title: 'Hero 5: Insufficient Funds',
      badge: 'Policy Enforced',
      badgeColor: 'bg-white/5 text-slate-300 border-white/10',
      icon: Wallet,
      iconColor: 'text-slate-400',
      description: 'Transaction declined due to user balance / daily UPI limit. System flags WAIT_RETRY with 0.0% discount, providing a 1-click retry link.',
      tag: 'Balance Low → 0% Discount Retry'
    },
    {
      id: 'circuit_breaker',
      title: 'Hero 6: Circuit Breaker Burst',
      badge: '2ms Fast Path',
      badgeColor: 'bg-amber-950/50 text-amber-300 border-amber-500/30',
      icon: Gauge,
      iconColor: 'text-amber-400',
      description: 'Fire three HDFC failures in one click. The breaker opens after the threshold and routes subsequent failures without an LLM call.',
      tag: '3 failures → HDFC OPEN → Cached Card'
    },
    {
      id: 'low_margin',
      title: 'Hero 7: Low-Margin Economics',
      badge: 'Profit Guard',
      badgeColor: 'bg-sky-950/50 text-sky-300 border-sky-500/30',
      icon: BadgeIndianRupee,
      iconColor: 'text-sky-400',
      description: 'Send a 3% margin order with a hostile discount request. The dynamic margin engine preserves the 2% profit buffer and grants 0%.',
      tag: '3% Margin → 0% Discount'
    },
    {
      id: 'ghost_processing',
      title: 'Hero 8: Ghost Processing',
      badge: 'Do Not Double-Charge',
      badgeColor: 'bg-amber-950/50 text-amber-300 border-amber-500/30',
      icon: Clock3,
      iconColor: 'text-amber-400',
      description: 'A bank-debited payment remains processing. Hold recovery for 15 minutes, poll status, and tell the customer not to pay again.',
      tag: 'PROCESSING → HOLD_AND_POLL_VERIFY'
    },
    {
      id: 'split_payment',
      title: 'Hero 9: Split Payment Failure',
      badge: 'Wallet Protected',
      badgeColor: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30',
      icon: Coins,
      iconColor: 'text-cyan-400',
      description: 'A ₹500 wallet contribution is held while a ₹1,500 UPI leg fails. Recovery charges only the remaining balance.',
      tag: '₹500 PAID + ₹1,500 DUE → PARTIAL LINK'
    },
    {
      id: 'mandate_limit',
      title: 'Hero 10: Mandate Limit',
      badge: 'Retry Suppressed',
      badgeColor: 'bg-rose-950/50 text-rose-300 border-rose-500/30',
      icon: Repeat2,
      iconColor: 'text-rose-400',
      description: 'An invoice exceeds the customer mandate limit. The engine skips doomed retries and offers one-time authorization or mandate upgrade.',
      tag: 'MAX AMOUNT → SPLIT OR UPGRADE'
    },
    {
      id: 'international_card',
      title: 'Hero 11: International Card Block',
      badge: 'FX Protected',
      badgeColor: 'bg-blue-950/50 text-blue-300 border-blue-500/30',
      icon: Globe2,
      iconColor: 'text-blue-400',
      description: 'An international card is blocked on the INR route. Create a USD checkout with 3DS-compatible routing and FX metadata.',
      tag: 'INTL CARD → USD + 3DS ROUTE'
    }
  ];

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white">
            Interactive Failure Scenarios (Evaluator Test Suite)
          </h2>
          <p className="text-xs text-slate-400">
            Click any scenario to fire a live simulated Razorpay webhook directly through the deterministic triage engine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = activeScenario === sc.id;

          return (
            <div
              key={sc.id}
              className={`rounded border p-3 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-950/25 ring-1 ring-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    <Icon className={`w-4 h-4 ${sc.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-white mb-1 leading-tight">
                  {sc.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal line-clamp-3 mb-2">
                  {sc.description}
                </p>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-2 py-1 rounded border border-white/10 mb-2.5 truncate">
                  {sc.tag}
                </div>

                <button
                  id={`btn-run-${sc.id}`}
                  onClick={() => onRunScenario(sc.id)}
                  disabled={isProcessing}
                  className={`w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                    isSelected
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isProcessing && isSelected ? 'Analyzing...' : 'Run Scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
