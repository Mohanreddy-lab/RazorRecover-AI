import React from 'react';
import { BarChart3, Home, MonitorCog, ShieldCheck, ShoppingBag } from 'lucide-react';

export type DemoView = 'home' | 'customer' | 'proof' | 'merchant' | 'admin';

interface DemoNavProps {
  view: DemoView;
  onChange: (view: DemoView) => void;
}

export const DemoNav: React.FC<DemoNavProps> = ({ view, onChange }) => (
  <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <button onClick={() => onChange('home')} className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm shadow-sky-600/30">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900">RazorRecover</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Payment resilience demo</span>
          </span>
        </button>
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Recovery Active
        </span>
      </div>

      <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
        <button onClick={() => onChange('home')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${view === 'home' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
          <Home className="h-3.5 w-3.5" /> Home
        </button>
        <button onClick={() => onChange('customer')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${view === 'customer' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
          <ShoppingBag className="h-3.5 w-3.5" /> Customer checkout
        </button>
        <button onClick={() => onChange('proof')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${view === 'proof' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
          <ShieldCheck className="h-3.5 w-3.5" /> Decision proof
        </button>
        <button onClick={() => onChange('merchant')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${view === 'merchant' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
          <BarChart3 className="h-3.5 w-3.5" /> Merchant dashboard
        </button>
        <button onClick={() => onChange('admin')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${view === 'admin' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
          <MonitorCog className="h-3.5 w-3.5" /> Admin console
        </button>
      </nav>
    </div>
  </header>
);
