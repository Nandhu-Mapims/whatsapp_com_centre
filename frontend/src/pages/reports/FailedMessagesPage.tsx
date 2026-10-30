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
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockDeliveryMessages } from '../../data/mockData';
import { DeliveryMessage } from '../../types';
import { useToast } from '../../context/ToastContext';

export const FailedMessagesPage: React.FC = () => {
  const { success, error, warning } = useToast();

  const [failedMessages, setFailedMessages] = useState<DeliveryMessage[]>(
    mockDeliveryMessages.filter((m) => m.providerStatus === 'failed')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [errorFilter, setErrorFilter] = useState('ALL');

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

  const handleSingleRetry = (msg: DeliveryMessage) => {
    if (!msg.canRetry) {
      error(
        'Retry Blocked',
        'This failure cannot be automatically retried because the recipient is opted out or the number is invalid on WhatsApp.'
      );
      return;
    }

    setFailedMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, retryAttempts: m.retryAttempts + 1 } : m
      )
    );
    success(
      'Retry Dispatched',
      `Re-queued message to ${msg.employeeName} with new idempotency token.`
    );
    setInspectMessage(null);
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
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Eligible ({retryEligibleCount})</span>
        </button>
      </PageHeader>

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
            <p className="text-[11px] text-slate-500 mt-1">Eligible for safe exponential retry</p>
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
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>

            <select
              value={errorFilter}
              onChange={(e) => setErrorFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            >
              <option value="ALL">All Error Types</option>
              <option value="PROVIDER_TIMEOUT_504">Gateway Timeout (504)</option>
              <option value="RATE_LIMIT_EXCEEDED">Rate Limit Backoff</option>
              <option value="EWCCMS_OPTED_OUT">Consent Opted-Out</option>
              <option value="WATI_ERR_NOT_ON_WHATSAPP">Not on WhatsApp</option>
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
                <th className="py-3 px-4">Retry Eligibility</th>
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
                    {msg.errorCode}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{msg.statusTimestamp}</td>
                  <td className="py-3 px-4">
                    {msg.canRetry ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Eligible (Try #{msg.retryAttempts + 1})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Permanent Block
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectMessage(msg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                      {msg.canRetry && (
                        <button
                          onClick={() => handleSingleRetry(msg)}
                          className="px-2.5 py-1 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded font-semibold transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}
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

              {/* Error Detail */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="font-mono font-bold text-xs">Error Code: {inspectMessage.errorCode}</div>
                <p className="leading-relaxed">{inspectMessage.errorDescription}</p>
              </div>

              {/* Retry Eligibility Explanation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-800">Retry Assessment</h4>
                {inspectMessage.canRetry ? (
                  <p className="text-emerald-700 leading-relaxed">
                    This error was caused by a transient network hiccup or rate-limiting spike. The message is safe to retry.
                  </p>
                ) : (
                  <p className="text-rose-700 leading-relaxed">
                    Automated retries are permanently blocked for this message to comply with WhatsApp opt-out policies or prevent invalid number bounces.
                  </p>
                )}
              </div>

              {inspectMessage.canRetry && (
                <div className="pt-2">
                  <button
                    onClick={() => handleSingleRetry(inspectMessage)}
                    className="w-full py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-attempt Dispatch
                  </button>
                </div>
              )}
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
