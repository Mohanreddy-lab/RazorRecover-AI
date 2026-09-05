import React from 'react';
import { Landmark, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { BankHealthInfo, BankCode } from '../types';

interface BankHealthMatrixProps {
  banks: BankHealthInfo[];
  onToggleStatus: (code: BankCode, newStatus: 'OPERATIONAL' | 'DEGRADED' | 'DOWN') => void;
}

export const BankHealthMatrix: React.FC<BankHealthMatrixProps> = ({ banks, onToggleStatus }) => {
  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pb-2.5 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-400" />
            Bank Infrastructure Health Matrix (NPCI Telemetry)
          </h2>
          <p className="text-xs text-slate-400">
            RazorRecover monitors issuer bank switch health to route away from degraded gateways before retrying.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Click toggle to simulate bank outage
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {banks.map((bank) => {
          const isOperational = bank.status === 'OPERATIONAL';
          const isDegraded = bank.status === 'DEGRADED';
          const isDown = bank.status === 'DOWN';

          let statusBg = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
          let statusLabel = 'OPERATIONAL';
          let Icon = CheckCircle2;

          if (isDegraded) {
            statusBg = 'bg-amber-950/40 text-amber-400 border-amber-500/30';
            statusLabel = 'DEGRADED';
            Icon = AlertCircle;
          } else if (isDown) {
            statusBg = 'bg-rose-950/40 text-rose-400 border-rose-500/30';
            statusLabel = 'OUTAGE';
            Icon = AlertCircle;
          }

          return (
            <div
              key={bank.code}
              className={`rounded border p-3 flex flex-col justify-between transition-all ${
                !isOperational
                  ? 'border-amber-500/30 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white font-mono tracking-wider">
                    {bank.code}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${statusBg}`}>
                    <Icon className="w-3 h-3" />
                    {statusLabel}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-300 truncate mb-2">
                  {bank.name}
                </div>

                <div className="space-y-1 text-[11px] text-slate-400 mb-3 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Success Rate:</span>
                    <span className={bank.successRate < 70 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {bank.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Latency:
                    </span>
                    <span className={bank.latencyMs > 2000 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {bank.latencyMs}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Toggle Buttons */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                <button
                  onClick={() => onToggleStatus(bank.code, isOperational ? 'DEGRADED' : 'OPERATIONAL')}
                  className={`w-full text-[10px] font-medium py-1 px-1.5 rounded transition-all border ${
                    isOperational
                      ? 'bg-white/5 hover:bg-amber-950/40 hover:text-amber-300 text-slate-300 border-white/10'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 font-semibold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  {isOperational ? 'Simulate Degraded' : 'Restore Healthy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
