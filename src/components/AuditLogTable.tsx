import React, { useState } from 'react';
import { ListFilter, FileText, CheckCircle, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { WebhookAuditLog } from '../types';
const actionBadgeStyles: Record<string, string> = {
  HOLD_AND_POLL_VERIFY: 'bg-amber-950/50 text-amber-300 border-amber-500/40',
  GENERATE_PARTIAL_RECOVERY_LINK: 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40',
  SPLIT_MANDATE_OR_UPGRADE_LINK: 'bg-rose-950/50 text-rose-300 border-rose-500/40',
  DYNAMIC_CURRENCY_ROUTING: 'bg-blue-950/50 text-blue-300 border-blue-500/40'
};

interface AuditLogTableProps {
  logs: WebhookAuditLog[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<WebhookAuditLog | null>(null);
  const [filterReason, setFilterReason] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterReason === 'ALL') return true;
    return log.failureReason === filterReason;
  });

  return (
    <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-emerald-400" />
            Live Webhook & Triage Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Real-time record of payment.failed events, rule decisions, and guardrail enforcement.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'BANK_DOWN', 'ALREADY_PAID', 'INSUFFICIENT_FUNDS', 'GHOST_PROCESSING', 'SPLIT_PAYMENT_FAILURE', 'MANDATE_MAX_AMOUNT_EXCEEDED', 'INTERNATIONAL_CARD_BLOCK'].map((reason) => (
            <button
              key={reason}
              onClick={() => setFilterReason(reason)}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider transition-all uppercase border ${
                filterReason === reason
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[10px] uppercase tracking-wider font-mono">
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Bank / Error</th>
              <th className="py-2.5 px-3">AI Diagnosis</th>
              <th className="py-2.5 px-3">Action Taken</th>
              <th className="py-2.5 px-3">Discount</th>
              <th className="py-2.5 px-3">Guardrail</th>
              <th className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  No webhook events recorded yet. Run a scenario above to test!
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isHalt = log.actionTaken === 'HALT_ALREADY_PAID';
                const isBankDown = log.failureReason === 'BANK_DOWN';
                const actionBadgeStyle = actionBadgeStyles[log.actionTaken] || '';

                return (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-white">
                      {log.orderId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="font-semibold text-slate-200">{log.bank || 'UPI'}</span>
                      <span className="text-slate-500 block text-[10px] font-mono">{log.errorCode || 'UNKNOWN'}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          actionBadgeStyle
                            ? actionBadgeStyle
                            : isBankDown
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                            : isHalt
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : 'bg-sky-950/40 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {log.failureReason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {isHalt ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Halted (Suppressed)
                        </span>
                      ) : (
                        <span className="text-slate-300 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className={actionBadgeStyle ? `inline-flex items-center px-2 py-0.5 rounded border ${actionBadgeStyle}` : ''}>{log.actionTaken}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {log.discountPercent > 0 ? (
                        <span className="text-emerald-400 font-bold">+{log.discountPercent}%</span>
                      ) : (
                        <span className="text-slate-500">0.0%</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.guardrailClamped ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-500/30">
                          Clamped (≤10%)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">PASS</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-xl max-w-xl w-full p-5 shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Webhook Event & Reasoning Trace
                </h3>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">Log ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-3 rounded border border-white/10 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Order ID:</span>
                  <span className="font-bold text-white">{selectedLog.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Processing Latency:</span>
                  <span className="font-bold text-white">{selectedLog.processingTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">AI Engine:</span>
                  <span className="font-bold text-emerald-400">{selectedLog.aiModel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Signature Verified:</span>
                  <span className="font-bold text-emerald-400">{selectedLog.signatureVerified ? 'YES (HMAC-SHA256)' : 'SIMULATED'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Drafted Customer WhatsApp Message
                </label>
                <div className="p-3 bg-white/[0.03] rounded text-slate-200 font-sans text-xs border border-white/10 leading-relaxed">
                  {selectedLog.customerMessage}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Raw Audit Payload
                </label>
                <pre className="p-3 bg-[#050505] text-emerald-400 rounded border border-white/10 overflow-x-auto text-[11px] font-mono leading-tight">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
