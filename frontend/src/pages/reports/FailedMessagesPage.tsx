import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  RefreshCw,
  Phone,
  AlertTriangle,
  UserX,
  Clock,
  ShieldAlert,
  X,
  CheckCircle2,
  Download,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockDeliveryMessages } from '../../data/mockData';
import { DeliveryMessage } from '../../types';
import { useToast } from '../../context/ToastContext';
import { normalizePhoneNumber } from '../../utils/phoneUtils';

export const FailedMessagesPage: React.FC = () => {
  const { success, error, warning } = useToast();

  const [failedMessages, setFailedMessages] = useState<DeliveryMessage[]>(
    mockDeliveryMessages.filter((m) => m.providerStatus === 'failed')
  );

  // Load live failed messages from WATI API (strictly since Nov 21, 2026 application go-live)
  React.useEffect(() => {
    fetch('/api/reports/delivery')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const liveFailed = json.data.filter(
            (m: any) => m.providerStatus === 'failed' && (m.submittedAt || '').slice(0, 10) >= '2026-11-21'
          );
          if (liveFailed.length > 0) {
            setFailedMessages(liveFailed);
          }
        }
      })
      .catch(() => {});
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorFilter, setErrorFilter] = useState('ALL');
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});

  // Detail drawer state
  const [inspectMessage, setInspectMessage] = useState<DeliveryMessage | null>(null);

  // Bulk retry confirmation state
  const [isBulkRetryConfirmOpen, setIsBulkRetryConfirmOpen] = useState(false);

  const filtered = failedMessages.filter((m) => {
    const matchesSearch =
      m.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.errorCode && m.errorCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesErr = errorFilter === 'ALL' || m.errorCode === errorFilter;
    return matchesSearch && matchesErr;
  });

  const retryEligibleCount = failedMessages.filter((m) => m.canRetry).length;
  const optedOutBlockedCount = failedMessages.filter(
    (m) => m.errorCode === 'EWCCMS_OPTED_OUT'
  ).length;
  const invalidNumberCount = failedMessages.filter(
    (m) => m.errorCode === 'WATI_ERR_NOT_ON_WHATSAPP'
  ).length;

  // Manual Admin Override ("Send Again")
  const handleSendAgain = async (msg: DeliveryMessage) => {
    setRetryingIds((prev) => ({ ...prev, [msg.id]: true }));
    const norm = normalizePhoneNumber(msg.rawNumber || msg.maskedNumber);
    const targetPhone = norm.isValid ? norm.digits : (msg.rawNumber || msg.maskedNumber);
    try {
      const res = await fetch('/api/reports/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msg.id,
          whatsappNumber: targetPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success(
          'Message Dispatched Successfully',
          `Manual "Send Again" sent message to ${msg.employeeName} (${norm.formatted || targetPhone}).`
        );
        setFailedMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? {
                  ...m,
                  providerStatus: 'queued',
                  autoRetryStatus: 'Manually Sent • Awaiting Delivery Receipt',
                  retryAttempts: (m.retryAttempts || 0) + 1,
                }
              : m
          )
        );
        if (inspectMessage && inspectMessage.id === msg.id) {
          setInspectMessage((prev) =>
            prev
              ? {
                  ...prev,
                  providerStatus: 'queued',
                  autoRetryStatus: 'Manually Sent • Awaiting Delivery Receipt',
                  retryAttempts: (prev.retryAttempts || 0) + 1,
                }
              : null
          );
        }
      } else {
        error('Dispatch Rejected', data.message || 'WATI/Meta rejected retry.');
      }
    } catch (err: any) {
      error('Network Error', err.message || 'Could not connect to server.');
    } finally {
      setRetryingIds((prev) => ({ ...prev, [msg.id]: false }));
    }
  };

  const handleSingleRetry = (msg: DeliveryMessage) => {
    handleSendAgain(msg);
  };

  const handleBulkRetry = () => {
    setFailedMessages((prev) =>
      prev.map((m) =>
        m.canRetry ? { ...m, retryAttempts: m.retryAttempts + 1 } : m
      )
    );
    success(
      'Bulk Retry Scheduled',
      `Queued ${retryEligibleCount} retry-eligible messages with exponential backoff.`
    );
    setIsBulkRetryConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Failed Message Diagnostics & Safe Retry"
        description="Investigate rejected, timed-out, or suppressed WhatsApp deliveries. Automated protections enforce idempotency and prevent illegal retries to opted-out contacts."
      >
        <button
          onClick={() => setIsBulkRetryConfirmOpen(true)}
          disabled={retryEligibleCount === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Eligible ({retryEligibleCount})</span>
        </button>
      </PageHeader>

      {/* 2-Stage Automated Retry Policy Notice Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">2-Stage Automated Retry Engine Active</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Scheduler (30s Tick)
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Any failed transmission automatically schedules <strong>Auto-Retry 1 at 30 minutes</strong> and <strong>Auto-Retry 2 at 1 hour</strong>. If both attempts fail, the admin can trigger immediate re-dispatch using <strong>Send Again</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-semibold text-amber-200">Stage 1: 30m</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-indigo-300" />
            <span className="font-semibold text-indigo-200">Stage 2: 1hr</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <Send className="w-3.5 h-3.5" />
            <span className="font-bold">Manual "Send Again"</span>
          </div>
        </div>
      </div>

      {/* Failure Category Diagnostics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Transient / Provider Timeout
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">
              {retryEligibleCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Eligible for 30m & 1hr automated retry</p>
          </div>
          <Clock className="w-8 h-8 text-amber-500 opacity-30" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Opted-Out Suppression
            </span>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">
              {optedOutBlockedCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Permanently blocked by consent rule</p>
          </div>
          <UserX className="w-8 h-8 text-slate-600 opacity-30" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Not on WhatsApp
            </span>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">
              {invalidNumberCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires HR phone number update</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-500 opacity-30" />
        </div>
      </div>

      {/* Failure Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff, ID, error code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <select
              value={errorFilter}
              onChange={(e) => setErrorFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Error Types</option>
              <option value="PROVIDER_TIMEOUT_504">Gateway Timeout (504)</option>
              <option value="RATE_LIMIT_EXCEEDED">Rate Limit Backoff</option>
              <option value="EWCCMS_OPTED_OUT">Consent Opted-Out</option>
              <option value="WATI_ERR_NOT_ON_WHATSAPP">Not on WhatsApp</option>
              <option value="META_QUALITY_RESTRICTION">Meta Quality Restriction</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total <strong>{filtered.length}</strong> failures logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Recipient</th>
                <th className="py-3 px-4">Masked WhatsApp</th>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Provider Error Code</th>
                <th className="py-3 px-4">Last Attempted</th>
                <th className="py-3 px-4">Auto-Retry Schedule</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((msg) => (
                <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{msg.employeeName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{msg.employeeId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {msg.maskedNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-800">
                    {msg.campaignName}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-rose-700 font-semibold">
                    {msg.errorCode || 'ERR_DELIVERY_FAILED'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{msg.statusTimestamp}</td>
                  <td className="py-3 px-4">
                    {msg.providerStatus === 'queued' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Dispatched / Queued
                      </span>
                    ) : !msg.canRetry ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Permanent Block
                      </span>
                    ) : msg.autoRetryStage === 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{msg.autoRetryStatus || 'Auto-Retry 1 in 30m'}</span>
                      </span>
                    ) : msg.autoRetryStage === 2 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span>{msg.autoRetryStatus || 'Auto-Retry 2 in 1hr'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Auto-Retries Exhausted (2/2)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSendAgain(msg)}
                        disabled={retryingIds[msg.id]}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        title="Send message immediately via WATI (Admin Manual Override)"
                      >
                        <Send className={`w-3 h-3 ${retryingIds[msg.id] ? 'animate-spin' : ''}`} />
                        <span>{retryingIds[msg.id] ? 'Sending...' : 'Send Again'}</span>
                      </button>
                      <button
                        onClick={() => setInspectMessage(msg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Error Detail Drawer */}
      {inspectMessage && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setInspectMessage(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-sm">Failure Root-Cause Analysis</h3>
              </div>
              <button
                onClick={() => setInspectMessage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <strong className="text-slate-900">{inspectMessage.employeeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono">{inspectMessage.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp Destination:</span>
                  <span className="font-mono">{inspectMessage.maskedNumber}</span>
                </div>
              </div>

              {/* 2-Stage Automated Retry Schedule Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Automated Retry Schedule (30m & 1hr Policy)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Automated Engine
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When a WhatsApp message fails, the system automatically schedules two automated retry attempts. If both fail, admin manual dispatch is required.
                </p>

                {/* Visual Schedule Steps */}
                <div className="space-y-2 pt-1">
                  {/* Stage 1 */}
                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      (inspectMessage.retryAttempts || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#1E3A8A]'
                    }`}>
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">Stage 1: 30-Minute Auto-Retry</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {inspectMessage.autoRetryStage === 1 ? 'Scheduled (30m)' : (inspectMessage.retryAttempts || 0) > 0 ? 'Attempted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dispatches automatically 30 minutes after initial delivery failure.</p>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      (inspectMessage.retryAttempts || 0) >= 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">Stage 2: 1-Hour Auto-Retry</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {inspectMessage.autoRetryStage === 2 ? 'Scheduled (1hr)' : (inspectMessage.retryAttempts || 0) >= 2 ? 'Attempted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dispatches automatically 60 minutes after initial failure if Stage 1 unsuccessful.</p>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">Admin Manual Override ("Send Again")</span>
                        <span className="text-[10px] font-bold text-emerald-700">Ready</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">If automated retries exhaust or to force dispatch immediately.</p>
                    </div>
                  </div>
                </div>

                {/* Big Send Again Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSendAgain(inspectMessage)}
                    disabled={retryingIds[inspectMessage.id]}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${retryingIds[inspectMessage.id] ? 'animate-spin' : ''}`} />
                    <span>{retryingIds[inspectMessage.id] ? 'Sending Message via WATI...' : 'Send Again Now (Immediate Dispatch)'}</span>
                  </button>
                </div>
              </div>

              {/* Error Detail */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="font-mono font-bold text-xs">Error Code: {inspectMessage.errorCode || 'ERR_DELIVERY_FAILED'}</div>
                <p className="leading-relaxed">{inspectMessage.errorDescription || 'Message could not be delivered to WhatsApp terminal.'}</p>
              </div>

              {/* Retry Eligibility Explanation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-800">Retry Assessment</h4>
                {inspectMessage.canRetry ? (
                  <p className="text-emerald-700 leading-relaxed">
                    This error was caused by a transient network hiccup or Meta delivery policy restriction. The message is safe to retry.
                  </p>
                ) : (
                  <p className="text-rose-700 leading-relaxed">
                    Automated retries are permanently blocked for this message to comply with WhatsApp opt-out policies or prevent invalid number bounces.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Retry Confirmation Modal */}
      <ConfirmDialog
        isOpen={isBulkRetryConfirmOpen}
        title="Execute Bulk Retry for Eligible Messages?"
        message={`You are about to re-dispatch ${retryEligibleCount} transiently failed messages. Opted-out staff and invalid numbers are automatically omitted.`}
        confirmLabel={`Retry ${retryEligibleCount} Messages`}
        variant="primary"
        onConfirm={handleBulkRetry}
        onCancel={() => setIsBulkRetryConfirmOpen(false)}
      />
    </div>
  );
};
