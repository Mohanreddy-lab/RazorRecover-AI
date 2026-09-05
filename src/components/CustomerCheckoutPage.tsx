import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck, ShoppingBag, Smartphone, Truck } from 'lucide-react';
import { RecoverySession, RazorpayConfig, RazorpayOrder } from '../types';
import { LivePaymentEvent } from '../types';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface CustomerCheckoutPageProps {
  order: RazorpayOrder | null;
  activeSession: RecoverySession | null;
  onTriggerFailure: () => Promise<void>;
  onCompletePayment: (orderId: string, sessionId: string, method: string) => Promise<void>;
  liveEvents: LivePaymentEvent[];
  razorpayConfig: RazorpayConfig;
  onCreateRazorpayOrder: (orderId: string, amount: number, currency: string) => Promise<{ id: string; amount: number; currency: string }>;
  onVerifyRazorpayPayment: (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => Promise<void>;
}

export const CustomerCheckoutPage: React.FC<CustomerCheckoutPageProps> = ({ order, activeSession, onTriggerFailure, onCompletePayment, liveEvents = [], razorpayConfig, onCreateRazorpayOrder, onVerifyRazorpayPayment }) => {
  const [method, setMethod] = useState<'CARD' | 'UPI'>('CARD');
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [razorpayLoadError, setRazorpayLoadError] = useState(false);
  const product = order || { id: 'ord_outage_1001', amount: 749900, customerName: 'Rohan Verma', itemsDescription: 'Atlas Runner Shoes', status: 'attempted' } as RazorpayOrder;
  const hasRecovery = Boolean(activeSession);
  const payable = activeSession?.discountedAmount ?? product.amount;
  const latestEvent = liveEvents[0];

  const loadRazorpayCheckout = () => new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      setIsRazorpayReady(true);
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        setIsRazorpayReady(true);
        resolve();
      } else {
        setRazorpayLoadError(true);
        reject(new Error('Razorpay checkout loaded without its payment API.'));
      }
    };
    script.onerror = () => {
      setRazorpayLoadError(true);
      reject(new Error('Razorpay Test Checkout could not load. Allow checkout.razorpay.com in the browser network and retry.'));
    };
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    if (!activeSession) {
      setIsPaying(true);
      await onTriggerFailure();
      setMessage('Payment failed. We are checking the bank route and preparing the safest next step.');
      setIsPaying(false);
      return;
    }
    setIsPaying(true);
    try {
      if (razorpayConfig.enabled) {
        if (!razorpayConfig.keyId) throw new Error('Razorpay Test Mode is enabled but the public key is missing.');
        if (!isRazorpayReady || !window.Razorpay) await loadRazorpayCheckout();
        const razorpayOrder = await onCreateRazorpayOrder(product.id, payable, product.currency || 'INR');
        const checkout = new window.Razorpay({
          key: razorpayConfig.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Northstar Goods',
          description: product.itemsDescription,
          order_id: razorpayOrder.id,
          remember_customer: false,
          prefill: { name: product.customerName, email: product.customerEmail, contact: product.customerPhone },
          theme: { color: '#0284c7' },
          handler: async (response: any) => {
            try {
              await onVerifyRazorpayPayment(response);
              setMessage('Live Razorpay test payment verified. Your order is protected and ready to ship.');
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Payment verification failed.');
            } finally {
              setIsPaying(false);
            }
          },
          modal: { ondismiss: () => setIsPaying(false) }
        });
        checkout.open();
        return;
      }
      await onCompletePayment(product.id, activeSession.sessionId, method);
      setMessage('Payment confirmed. Your order is now protected and ready to ship.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment could not be completed.');
    } finally {
      setIsPaying(false);
    }
  };

  return <div className="min-h-[calc(100vh-66px)] bg-[#f6f8fb] text-slate-950">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-12">
      <section className="flex flex-col justify-center">
        <div className="mb-10 flex items-center gap-2 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white"><ShoppingBag className="h-4 w-4" /></span> northstar goods <span className="text-slate-400">/ checkout</span></div>
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Customer view</span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Payment recovery that proves every decision.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">RazorRecover watches payment state in real time, prevents duplicate charges, protects merchant margin, and gives the customer the safest next step.</p>
          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3"><p className="text-xs font-bold text-sky-900">Detect</p><p className="mt-1 text-[11px] leading-5 text-sky-800">Bank, pending, partial, mandate, and international failures.</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-900">Protect</p><p className="mt-1 text-[11px] leading-5 text-emerald-800">Idempotency, order locks, reconciliation, and margin guardrails.</p></div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><p className="text-xs font-bold text-violet-900">Recover</p><p className="mt-1 text-[11px] leading-5 text-violet-800">A verified fallback route with a live audit trail.</p></div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-medium text-slate-600"><span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-sky-600" /> Free delivery</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure payment</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-violet-600" /> Easy returns</span></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:p-7">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order summary</p><h2 className="mt-1 text-xl font-bold">Atlas Runner Shoes</h2><p className="mt-1 text-sm text-slate-500">Stone / EU 42 · 1 item</p></div><div className="rounded-xl bg-slate-100 px-4 py-3 text-right"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p><p className="text-lg font-bold">₹{(payable / 100).toFixed(2)}</p></div></div>
        {hasRecovery && <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-bold">Your payment is protected</p><p className="mt-1 text-xs leading-5">The first attempt did not settle. Your recovery route is ready{activeSession.discountPercent ? ` with ${activeSession.discountPercent}% off` : ''}.</p></div></div>}
        {latestEvent && <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-sky-950"><span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" /> Live payment status</div><p className="mt-1 text-xs text-sky-800">{latestEvent.title} · {latestEvent.detail}</p></div>}
        {message && <div className={`mt-5 flex gap-3 rounded-xl border p-4 text-sm ${message.includes('confirmed') ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-xs leading-5">{message}</p></div>}
        <div className="mt-6 space-y-4"><p className="text-sm font-bold">Payment method</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setMethod('CARD')} className={`rounded-xl border p-4 text-left ${method === 'CARD' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 hover:border-slate-400'}`}><CreditCard className="mb-3 h-5 w-5" /><span className="block text-sm font-bold">Card</span><span className={`text-xs ${method === 'CARD' ? 'text-slate-300' : 'text-slate-500'}`}>Visa, Mastercard</span></button><button onClick={() => setMethod('UPI')} className={`rounded-xl border p-4 text-left ${method === 'UPI' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 hover:border-slate-400'}`}><Smartphone className="mb-3 h-5 w-5" /><span className="block text-sm font-bold">UPI</span><span className={`text-xs ${method === 'UPI' ? 'text-slate-300' : 'text-slate-500'}`}>GPay, PhonePe</span></button></div><button onClick={handlePayment} disabled={isPaying || product.status === 'paid'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">{isPaying ? 'Checking payment...' : product.status === 'paid' ? 'Order already paid' : hasRecovery ? `Pay securely · ₹${(payable / 100).toFixed(2)}` : `Pay now · ₹${(payable / 100).toFixed(2)}`} {!isPaying && <ArrowRight className="h-4 w-4" />}</button></div>
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> {razorpayConfig.enabled ? (isRazorpayReady ? 'Razorpay Test Mode · Server signature verified' : razorpayLoadError ? 'Razorpay Test Mode · Checkout script blocked' : 'Razorpay Test Mode configured · Loading checkout') : 'Local demo mode · Add Razorpay test credentials for live checkout'}</div>
      </section>
    </div>
  </div>;
};
