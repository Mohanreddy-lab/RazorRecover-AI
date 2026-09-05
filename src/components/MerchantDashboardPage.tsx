import React from 'react';
import { Activity, ArrowRight, CheckCircle2, CircleDollarSign, Database, Gauge, Lock, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react';
import { EngineState, LivePaymentEvent } from '../types';

interface MerchantDashboardPageProps {
  state: EngineState | null;
  liveEvents: LivePaymentEvent[];
  onRunReconciliation: (scenario: any) => Promise<any>;
}

const formatCurrency = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const MerchantDashboardPage: React.FC<MerchantDashboardPageProps> = ({ state, liveEvents, onRunReconciliation }) => {
  const metrics = state?.metrics || {
    totalWebhooks: 0,
    failuresDiagnosed: 0,
    doubleChargesPrevented: 0,
    guardrailsEnforced: 0,
    outagesMitigated: 0,
    recoveredRevenuePaise: 0,
    originalLostRevenuePaise: 0,
    recoveredRevenueFormatted: '₹0.00',
    originalLostRevenueFormatted: '₹0.00'
  };

  const latestLiveEvent = liveEvents[0];

  const healthRows = state?.bankHealth || [
    { code: 'HDFC', name: 'HDFC Core Node-01', status: 'DEGRADED', latencyMs: 380, successRate: 74.2, notes: 'Failover triggered' },
    { code: 'ICICI', name: 'ICICI Direct Route', status: 'OPERATIONAL', latencyMs: 38, successRate: 99.8, notes: 'Primary recovery lane' },
    { code: 'SBI', name: 'SBI ePay Mesh', status: 'OPERATIONAL', latencyMs: 52, successRate: 98.9, notes: 'Healthy' }
  ];

  const breakerRows = state?.circuitBreakers || [
    { bank: 'HDFC', isOpen: true, failureCount: 3 },
    { bank: 'ICICI', isOpen: false, failureCount: 1 },
    { bank: 'SBI', isOpen: false, failureCount: 0 }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Resilience operations console
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Merchant Operations &amp; Resilience Console</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor recovery decisions, bank health, customer protection, and reconciliation exceptions in real time.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              <span className="text-slate-400">Cluster:</span> <span className="font-semibold text-emerald-600">Healthy</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
              <span className="text-slate-400">Latency:</span> <span className="font-semibold text-sky-700">4.1ms</span>
            </div>
            <button
              onClick={() => onRunReconciliation('missed_webhook')}
              className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white shadow-sm transition hover:bg-sky-700"
            >
              Reconcile now
            </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total webhooks ingested', value: metrics.totalWebhooks.toLocaleString('en-IN'), delta: '+8.2%/hr', accent: 'text-slate-900' },
            { label: 'Recovered revenue', value: metrics.recoveredRevenueFormatted, delta: '+18.4% WoW', accent: 'text-emerald-600' },
            { label: 'Double charges intercepted', value: metrics.doubleChargesPrevented.toString(), delta: '100% Protected', accent: 'text-slate-900' },
            { label: 'Guardrails enforced', value: metrics.guardrailsEnforced.toString(), delta: 'Zero margin loss', accent: 'text-slate-900' },
            { label: 'Automated reconcile rate', value: '99.98%', delta: 'Zero delta', accent: 'text-slate-900' }
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{metric.label}</span>
                <Activity className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className={`text-2xl font-bold tracking-tight ${metric.accent}`}>{metric.value}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{metric.delta}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Acquirer route health &amp; circuit breakers</h2>
                    <p className="text-xs text-slate-500">Dynamic rerouting based on bank failure signals</p>
                  </div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{healthRows.length} active nodes</span>
              </div>

              <div className="space-y-3">
                {healthRows.map((bank) => {
                  const isLive = bank.status === 'OPERATIONAL';
                  return (
                    <div key={bank.code} className={`rounded-xl border p-4 ${isLive ? 'border-slate-200 bg-slate-50/60' : 'border-rose-200 bg-rose-50/50'}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{bank.name}</span>
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {bank.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Success: <span className={`font-semibold ${isLive ? 'text-emerald-600' : 'text-rose-600'}`}>{bank.successRate}%</span> • Latency: <span className="font-mono text-slate-700">{bank.latencyMs}ms</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-2.5 py-1 text-[10px] font-medium ${isLive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-white text-rose-700'}`}>
                            {isLive ? 'Live ingress' : 'Bypass active'}
                          </span>
                          <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50">
                            {isLive ? 'Test' : 'Failover'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Circuit breaker state</h2>
                  <p className="text-xs text-slate-500">Policy response and failover lock status</p>
                </div>
              </div>

              <div className="space-y-3">
                {breakerRows.map((row) => (
                  <div key={row.bank} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{row.bank}</div>
                      <div className="text-[11px] text-slate-500">Failure count: {row.failureCount}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${row.isOpen ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {row.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Live decision timeline</h2>
                    <p className="text-xs text-slate-400">Decision proof stream</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> streaming now
                </span>
              </div>

              <div className="space-y-4">
                {(liveEvents.length ? liveEvents.slice(0, 5) : [
                  { id: 'seed', title: 'Webhook ingestion', detail: 'Awaiting live scenario data', status: 'active', stage: 'WAITING' },
                ]).map((event, index) => (
                  <div key={event.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${event.status === 'blocked' ? 'bg-amber-500/20 text-amber-300' : event.status === 'complete' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{event.title}</p>
                        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-300">{event.stage}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{event.detail}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{new Date(event.timestamp || Date.now()).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Revenue protection overview</h2>
                    <p className="text-xs text-slate-500">Cash recovered vs. exposure prevented</p>
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Recovered Revenue</span>
                    <span className="font-semibold text-emerald-600">{metrics.recoveredRevenueFormatted}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[82%] rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Prevention Exposure</span>
                    <span className="font-semibold text-slate-700">{metrics.originalLostRevenueFormatted}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[46%] rounded-full bg-sky-500" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Lock className="h-4 w-4 text-emerald-600" />
                      Zero double-charge
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">{metrics.doubleChargesPrevented}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-sky-600" />
                      Failures diagnosed
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">{metrics.failuresDiagnosed}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
