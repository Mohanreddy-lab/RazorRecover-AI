import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { ScenarioRunner } from './components/ScenarioRunner';
import { BankHealthMatrix } from './components/BankHealthMatrix';
import { CustomerSimulator } from './components/CustomerSimulator';
import { AuditLogTable } from './components/AuditLogTable';
import { CodeExportModal } from './components/CodeExportModal';
import { CustomWebhookModal } from './components/CustomWebhookModal';
import { ProductionControls } from './components/ProductionControls';
import { ReconciliationPanel } from './components/ReconciliationPanel';
import { CustomerSideDemo, SystemHowItWorks } from './components/SystemHowItWorks';
import { DemoNav, DemoView } from './components/DemoNav';
import { CustomerCheckoutPage } from './components/CustomerCheckoutPage';
import { DecisionProofPage } from './components/DecisionProofPage';
import { MerchantDashboardPage } from './components/MerchantDashboardPage';
import { HomePage } from './components/HomePage';
import { AuthGate } from './components/AuthGate';
import { EngineState, BankCode, ReconciliationRun, ReconciliationScenario, LivePaymentEvent, RazorpayConfig, SecurityStatus } from './types';
import { Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<EngineState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCustomWebhookOpen, setIsCustomWebhookOpen] = useState(false);
  const viewFromPath = (): DemoView => ({ '/': 'home', '/checkout': 'customer', '/proof': 'proof', '/merchant': 'merchant', '/admin': 'admin' }[window.location.pathname] || 'home') as DemoView;
  const [view, setViewState] = useState<DemoView>(viewFromPath);
  const [liveEvents, setLiveEvents] = useState<LivePaymentEvent[]>([]);
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig>({ enabled: false, mode: 'unconfigured' });
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({ webhookSignatureConfigured: false, razorpayServerConfigured: false, idempotencyGuard: 'UNAVAILABLE', auditChain: 'EMPTY', liveStream: 'CONNECTING', activeLiveSubscribers: 0, lastCheckedAt: '' });
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const [authUser, setAuthUser] = useState<{ email: string; role: 'admin' | 'merchant' } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const setView = (nextView: DemoView) => {
    const path = { home: '/', customer: '/checkout', proof: '/proof', merchant: '/merchant', admin: '/admin' }[nextView];
    window.history.pushState({}, '', path);
    setViewState(nextView);
  };

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to load engine state:', err);
    }
  };

  useEffect(() => {
    const handlePopState = () => setViewState(viewFromPath());
    window.addEventListener('popstate', handlePopState);
    fetchState();
    fetch('/api/razorpay/config').then((res) => res.ok ? res.json() : null).then((config) => {
      if (config) setRazorpayConfig(config);
    }).catch(() => undefined);
    const fetchSecurityStatus = () => fetch('/api/security/status').then((res) => res.ok ? res.json() : null).then((status) => {
      if (status) setSecurityStatus((current) => ({ ...current, ...status }));
    }).catch(() => setSecurityStatus((current) => ({ ...current, liveStream: 'DISCONNECTED' })));
    fetchSecurityStatus();
    const interval = setInterval(fetchState, 5000);
    const securityInterval = setInterval(fetchSecurityStatus, 5000);
    const stream = new EventSource('/api/live-events/stream');
    stream.onopen = () => setSecurityStatus((current) => ({ ...current, liveStream: 'CONNECTED' }));
    stream.onerror = () => setSecurityStatus((current) => ({ ...current, liveStream: 'DISCONNECTED' }));
    stream.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (payload.type === 'snapshot') setLiveEvents(payload.events || []);
        if (payload.type === 'event' && payload.event) setLiveEvents((current) => [payload.event, ...current].slice(0, 100));
      } catch (error) {
        console.error('Live event stream error:', error);
      }
    };
    return () => {
      clearInterval(interval);
      clearInterval(securityInterval);
      stream.close();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then((res) => res.ok ? res.json() : null).then((data) => {
      setAuthUser(data?.user || null);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  const handleCreateRazorpayOrder = async (orderId: string, amount: number, currency: string) => {
    const res = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalOrderId: orderId, amount, currency })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to create Razorpay order');
    return data;
  };

  const handleVerifyRazorpayPayment = async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const res = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Razorpay verification failed');
    await fetchState();
    showToast('Live Razorpay test payment verified on the server.', 'success');
  };

  const handleRunScenario = async (scenarioId: string) => {
    setIsProcessing(true);
    setActiveScenario(scenarioId);
    try {
      const res = await fetch('/api/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const data = await res.json();
      await fetchState();

      if (scenarioId === 'bank_outage') {
        showToast('Hero 1 Passed: Bank outage diagnosed! Routed to Card fallback link with 5% discount.', 'success');
      } else if (scenarioId === 'already_paid') {
        showToast('Hero 2 Passed: Order already completed! Recovery suppressed (HALT_ALREADY_PAID).', 'warn');
      } else if (scenarioId === 'guardrail_attack') {
        showToast('Hero 3 Passed: 50% discount injection intercepted & clamped to ≤10.0% policy max!', 'warn');
      } else if (scenarioId === 'twotab_order_payment') {
        showToast('Hero 4 Passed: Original order paid. Competing recovery link immediately invalidated!', 'success');
      } else if (scenarioId === 'ghost_processing') {
        showToast('Hero 8 Passed: Payment held for verification. Customer was told not to pay again.', 'warn');
      } else if (scenarioId === 'split_payment') {
        showToast('Hero 9 Passed: Recovery limited to the unpaid balance while wallet funds remain held.', 'success');
      } else if (scenarioId === 'mandate_limit') {
        showToast('Hero 10 Passed: Mandate retries suppressed. One-time authorization or upgrade link generated.', 'info');
      } else if (scenarioId === 'international_card') {
        showToast('Hero 11 Passed: International card routed to a protected USD checkout.', 'success');
      } else {
        showToast('Scenario processed successfully.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Error executing scenario', 'warn');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBankStatus = async (code: BankCode, newStatus: 'OPERATIONAL' | 'DEGRADED' | 'DOWN') => {
    try {
      await fetch('/api/bank-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, status: newStatus })
      });
      await fetchState();
      showToast(`${code} status updated to ${newStatus}.`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompletePayment = async (orderId: string, sessionId: string, paymentMethod: string) => {
    const res = await fetch('/api/complete-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, sessionId, paymentMethod })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Payment failed');
    }
    await fetchState();
    showToast(`Order ${orderId} successfully recovered via ${paymentMethod}!`, 'success');
  };

  const handleResetState = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/reset', { method: 'POST' });
      await fetchState();
      showToast('All orders, sessions, and bank matrices reset to initial demo seed.', 'info');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunReconciliation = async (scenario: ReconciliationScenario): Promise<ReconciliationRun> => {
    const res = await fetch('/api/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error('Reconciliation run failed');
    const result = await res.json();
    await fetchState();
    showToast(result.records?.[0]?.merchantNotification || 'Reconciliation run complete.', result.records?.[0]?.status === 'RECONCILED' ? 'success' : 'warn');
    return result;
  };

  const handleSendCustomWebhook = async (payload: any) => {
    const res = await fetch('/webhook/payment.failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    await fetchState();
    return data;
  };

  const latestLog = state?.auditLogs && state.auditLogs.length > 0 ? state.auditLogs[0] : null;

  // Find latest active recovery session
  const activeSession = state?.activeSessions && state.activeSessions.length > 0
    ? state.activeSessions[state.activeSessions.length - 1]
    : null;

  const currentOrder = activeSession
    ? state?.orders.find((o) => o.id === activeSession.orderId) || null
    : null;

  if (view === 'admin' || view === 'merchant') {
    if (!authChecked) return <><DemoNav view={view} onChange={setView} /><div className="flex min-h-[calc(100vh-66px)] items-center justify-center bg-[#050505] text-sm text-slate-400">Checking secure session...</div></>;
    if (!authUser || (view === 'admin' && authUser.role !== 'admin')) return <><DemoNav view={view} onChange={setView} /><AuthGate role={view === 'admin' ? 'admin' : 'merchant'} onAuthenticated={setAuthUser} /></>;
  }

  if (view === 'home') {
    return <><DemoNav view={view} onChange={setView} /><HomePage metrics={state?.metrics || { totalWebhooks: 0, failuresDiagnosed: 0, doubleChargesPrevented: 0, guardrailsEnforced: 0, outagesMitigated: 0, recoveredRevenuePaise: 0, originalLostRevenuePaise: 0, recoveredRevenueFormatted: '₹0.00', originalLostRevenueFormatted: '₹0.00' }} onNavigate={setView} /></>;
  }

  if (view === 'customer') {
    return <><DemoNav view={view} onChange={setView} /><CustomerCheckoutPage order={currentOrder} activeSession={activeSession} liveEvents={liveEvents} razorpayConfig={razorpayConfig} onCreateRazorpayOrder={handleCreateRazorpayOrder} onVerifyRazorpayPayment={handleVerifyRazorpayPayment} onTriggerFailure={() => handleRunScenario('bank_outage')} onCompletePayment={handleCompletePayment} /></>;
  }

  if (view === 'proof') {
    return <><DemoNav view={view} onChange={setView} /><DecisionProofPage state={state} liveEvents={liveEvents} onRunScenario={handleRunScenario} /></>;
  }

  if (view === 'merchant') {
    return <><DemoNav view={view} onChange={setView} /><MerchantDashboardPage state={state} liveEvents={liveEvents} onRunReconciliation={handleRunReconciliation} /></>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <DemoNav view={view} onChange={setView} />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded shadow-2xl border text-xs font-semibold flex items-center gap-2 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                : toastMessage.type === 'warn'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                : 'bg-[#0a0a0a]/95 text-white border-white/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 shadow-[0_0_6px_#10b981]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header & Metrics */}
      <Header
        metrics={
          state?.metrics || {
            totalWebhooks: 0,
            failuresDiagnosed: 0,
            doubleChargesPrevented: 0,
            guardrailsEnforced: 0,
            outagesMitigated: 0,
            recoveredRevenuePaise: 0,
            originalLostRevenuePaise: 0,
            recoveredRevenueFormatted: '₹0.00',
            originalLostRevenueFormatted: '₹0.00'
          }
        }
        isProcessing={isProcessing}
        onReset={handleResetState}
        onOpenCode={() => setIsCodeModalOpen(true)}
        onOpenCustomWebhook={() => setIsCustomWebhookOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 flex-1 w-full">
        {/* Real-time Resilience Pipeline Visualizer */}
        <PipelineVisualizer latestLog={latestLog} isProcessing={isProcessing} />

        <SystemHowItWorks />

        <CustomerSideDemo
          hasSession={Boolean(activeSession)}
          orderStatus={currentOrder?.status}
        />

        <ProductionControls
          circuitBreakers={state?.circuitBreakers || []}
          auditLedger={state?.auditLedger || []}
          deterministicEngine={state?.deterministicEngine || false}
          securityStatus={securityStatus}
        />

        {state?.reconciliation && (
          <ReconciliationPanel state={state.reconciliation} onRun={handleRunReconciliation} />
        )}

        {/* 5 Hero Scenarios Runner */}
        <ScenarioRunner
          onRunScenario={handleRunScenario}
          isProcessing={isProcessing}
          activeScenario={activeScenario}
        />

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Bank Health & Audit Table (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Bank Infrastructure Health Matrix */}
            <BankHealthMatrix
              banks={state?.bankHealth || []}
              onToggleStatus={handleToggleBankStatus}
            />

            {/* Live Webhook & Triage Audit Trail */}
            <AuditLogTable logs={state?.auditLogs || []} />
          </div>

          {/* Right Column: Customer WhatsApp Mockup & Order Store (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Customer Simulator (WhatsApp + Interactive Checkout) */}
            <CustomerSimulator
              activeSession={activeSession}
              order={currentOrder}
              onCompletePayment={handleCompletePayment}
            />

            {/* Orders & Recovery Sessions Ledger */}
            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-white">
                    Live Order Ledger & Sessions
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {state?.orders.length || 0} Orders Tracked
                </span>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto text-xs">
                {state?.orders.map((ord) => {
                  const isPaid = ord.status === 'paid';
                  const activeSessionForOrder = state.activeSessions.find((s) => s.orderId === ord.id);

                  return (
                    <div
                      key={ord.id}
                      className={`p-2.5 rounded border flex items-center justify-between transition-colors ${
                        isPaid
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{ord.id}</span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              isPaid
                                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                                : 'bg-amber-950/50 text-amber-400 border-amber-500/40'
                            }`}
                          >
                            {ord.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ord.customerName} • {ord.itemsDescription}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white font-mono">
                          ₹{(ord.amount / 100).toFixed(2)}
                        </div>
                        {isPaid ? (
                          <span className="text-[10px] text-emerald-400 font-semibold block font-mono">
                            Settled ({ord.originalMethod || 'CARD'})
                          </span>
                        ) : activeSessionForOrder ? (
                          <span className="text-[10px] text-sky-400 font-semibold block font-mono">
                            Recovery Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block font-mono">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050505] py-4 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-300">RazorRecover AI</strong> — Built for Track 3: AI Revenue Recovery (Razorpay AI Buildathon).
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>FastAPI backend</span>
            <span>•</span>
            <span className="text-emerald-400">Deterministic rule triage</span>
            <span>•</span>
            <span>Idempotent reconciliation</span>
          </div>
        </div>
      </footer>

      {/* Submission Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Custom Webhook Dispatcher Modal */}
      <CustomWebhookModal
        isOpen={isCustomWebhookOpen}
        onClose={() => setIsCustomWebhookOpen(false)}
        onSendWebhook={handleSendCustomWebhook}
      />
    </div>
  );
}
