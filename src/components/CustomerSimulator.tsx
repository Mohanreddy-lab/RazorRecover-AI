import React, { useState } from 'react';
import { Smartphone, Check, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Lock, Sparkles, XCircle } from 'lucide-react';
import { RecoverySession, RazorpayOrder } from '../types';

interface CustomerSimulatorProps {
  activeSession: RecoverySession | null;
  order: RazorpayOrder | null;
  onCompletePayment: (orderId: string, sessionId: string, method: string) => Promise<void>;
}

export const CustomerSimulator: React.FC<CustomerSimulatorProps> = ({
  activeSession,
  order,
  onCompletePayment
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Sync default method when session updates
  React.useEffect(() => {
    if (activeSession?.suggestedMethod) {
      setSelectedMethod(activeSession.suggestedMethod);
    }
  }, [activeSession]);

  const handlePay = async () => {
    if (!order || !activeSession) return;
    setIsPaying(true);
    try {
      await onCompletePayment(order.id, activeSession.sessionId, selectedMethod);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setIsCheckoutOpen(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  const isInvalidated = activeSession?.status === 'INVALIDATED_ALREADY_PAID';
  const isCompleted = activeSession?.status === 'COMPLETED' || order?.status === 'paid';

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white">
              Customer Checkout Surface
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            CUSTOMER VIEW
          </span>
        </div>

        {/* WhatsApp Mobile Frame */}
        <div className="bg-[#050505] rounded-2xl p-2.5 shadow-2xl border border-white/10 max-w-sm mx-auto">
          {/* Top WhatsApp Header */}
          <div className="bg-[#0e2117] text-white rounded-t-xl px-3 py-2 flex items-center justify-between text-xs border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-[10px] shadow-[0_0_8px_#10b981]">
                RR
              </div>
              <div>
                <div className="font-semibold flex items-center gap-1 text-white">
                  RazorRecover Merchant
                  <Check className="w-3 h-3 text-sky-400" />
                </div>
                <div className="text-[9px] text-emerald-400">Verified Business Account</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">11:42 AM</span>
          </div>

          {/* WhatsApp Chat Body */}
          <div className="bg-[#080d0b] p-3 rounded-b-xl min-h-[220px] flex flex-col justify-end text-xs">
            {activeSession ? (
              <div className="space-y-2">
                {/* Status Pill if invalidated or completed */}
                {isInvalidated && (
                  <div className="p-2 rounded bg-amber-950/80 border border-amber-500/40 text-amber-200 text-[11px] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Session Revoked:</strong> Order was paid through another channel. Link automatically expired to prevent double-charging!</span>
                  </div>
                )}

                {isCompleted && !isInvalidated && (
                  <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Payment Completed:</strong> ₹{((activeSession.discountedAmount) / 100).toFixed(2)} successfully settled.</span>
                  </div>
                )}

                {/* WhatsApp Chat Bubble */}
                <div className="bg-[#121c16] text-slate-100 rounded-lg p-2.5 border border-emerald-500/20 shadow-xs relative max-w-[95%]">
                  <div className="text-[10px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    RazorRecover Smart Notice
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-200 mb-2 whitespace-pre-wrap">
                    {activeSession.whatsappMessage}
                  </p>

                  {activeSession.discountPercent > 0 && (
                    <div className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono mb-2">
                      Authorized {activeSession.discountPercent}% Instant Discount Applied
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right">
                    Just now • Read ✓✓
                  </div>
                </div>

                {/* Action CTA Button inside WhatsApp */}
                {!isCompleted && !isInvalidated && (
                  <button
                    id="btn-whatsapp-recovery-link"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(16,185,129,0.35)] cursor-pointer"
                  >
                    <span>Complete via {activeSession.suggestedMethod}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-[11px] text-slate-400">Your payment activity will appear here.</p>
                <p className="text-[10px] text-slate-500">Run a scenario to receive a recovery message and secure checkout link.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Checkout Modal (Simulating Razorpay Standard Checkout) */}
      {isCheckoutOpen && activeSession && order && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-150">
            {/* Razorpay Brand Top Bar */}
            <div className="bg-[#050505] text-white p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                  RZP
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white">Razorpay Secure Checkout</h3>
                  <p className="text-[11px] text-emerald-400 font-mono">Session: {activeSession.sessionId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {paymentSuccess ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Payment Succeeded!</h4>
                  <p className="text-xs text-slate-400">
                    Order {order.id} verified and settled in database.
                    Revenue recovery successfully completed!
                  </p>
                </div>
              ) : isInvalidated ? (
                <div className="p-4 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ShieldCheck className="w-5 h-5" />
                    Double-Charge Protection Active
                  </div>
                  <p className="text-slate-300">
                    This order was already completed in another session. Payment has been refused to protect you from being charged twice!
                  </p>
                </div>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="bg-white/[0.02] p-3 rounded border border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Item:</span>
                      <span className="font-medium text-white">{order.itemsDescription}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Customer:</span>
                      <span className="font-medium text-white">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Original Price:</span>
                      <span className="line-through text-slate-500">
                        ₹{(activeSession.originalAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    {activeSession.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>Recovery Incentive ({activeSession.discountPercent}% Off):</span>
                        <span>-₹{((activeSession.originalAmount - activeSession.discountedAmount) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                      <span>Total Payable:</span>
                      <span className="text-emerald-400 font-mono">₹{(activeSession.discountedAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Select Payment Method (AI Recommended: <span className="text-emerald-400">{activeSession.suggestedMethod}</span>)
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedMethod('CARD')}
                        className={`p-2.5 rounded border flex flex-col items-center gap-1 transition-all ${
                          selectedMethod === 'CARD'
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold ring-1 ring-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Card (Safe)</span>
                      </button>

                      <button
                        onClick={() => setSelectedMethod('NETBANKING')}
                        className={`p-2.5 rounded border flex flex-col items-center gap-1 transition-all ${
                          selectedMethod === 'NETBANKING'
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold ring-1 ring-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Netbanking</span>
                      </button>

                      <button
                        onClick={() => setSelectedMethod('UPI')}
                        className={`p-2.5 rounded border flex flex-col items-center gap-1 transition-all ${
                          selectedMethod === 'UPI'
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold ring-1 ring-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        <span>UPI</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-bit encrypted Razorpay test gateway</span>
                  </div>

                  <button
                    id="btn-complete-checkout"
                    onClick={handlePay}
                    disabled={isPaying}
                    className="w-full py-2.5 px-4 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPaying ? 'Processing Settlement...' : `Pay ₹${(activeSession.discountedAmount / 100).toFixed(2)}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
