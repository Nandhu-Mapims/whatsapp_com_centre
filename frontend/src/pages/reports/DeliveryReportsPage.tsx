import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  CheckCheck,
  Eye,
  AlertCircle,
  Phone,
  RefreshCw,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockDeliveryMessages, mockCampaigns } from '../../data/mockData';
import { DeliveryMessage } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DeliveryReportsPage: React.FC = () => {
  const { success } = useToast();

  const [messages, setMessages] = useState<DeliveryMessage[]>(mockDeliveryMessages);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMessage, setSelectedMessage] = useState<DeliveryMessage | null>(null);

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.providerStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = messages.length;
  const readCount = messages.filter((m) => m.providerStatus === 'read').length;
  const deliveredCount = messages.filter(
    (m) => m.providerStatus === 'delivered' || m.providerStatus === 'read'
  ).length;
  const failedCount = messages.filter((m) => m.providerStatus === 'failed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Delivery Reports"
        description="Monitor individual message transit states received via WATI webhook callbacks (Submitted → Sent → Delivered → Read)."
      >
        <button
          onClick={() => success('Delivery Log Exported', 'Downloading delivery data in XLSX format.')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Delivery Log</span>
        </button>
      </PageHeader>

      {/* KPI Funnel Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Dispatched"
          value={total}
          subtitle="Processed by WATI gateway"
          icon={Send}
          accentColor="blue"
        />
        <StatCard
          title="Confirmed Delivered"
          value={deliveredCount}
          subtitle={`${((deliveredCount / total) * 100).toFixed(1)}% handset delivery`}
          icon={CheckCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Read Receipts"
          value={readCount}
          subtitle={`${((readCount / deliveredCount) * 100).toFixed(1)}% verified read rate`}
          icon={Eye}
          accentColor="primary"
        />
        <StatCard
          title="Failed / Blocked"
          value={failedCount}
          subtitle="Suppressed or provider error"
          icon={AlertCircle}
          accentColor="rose"
        />
      </div>

      {/* Filter and Message Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name, ID, campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            >
              <option value="ALL">All Outcomes</option>
              <option value="read">Read (Blue Ticks Confirmed)</option>
              <option value="delivered">Delivered (Double Ticks)</option>
              <option value="sent">Sent (Transmitted)</option>
              <option value="failed">Failed / Bounced</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong>{filtered.length}</strong> message outcomes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Recipient</th>
                <th className="py-3 px-4">Masked WhatsApp</th>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Provider Status</th>
                <th className="py-3 px-4">Status Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
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
                  <td className="py-3 px-4 font-mono text-slate-500">{msg.submittedAt}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={msg.providerStatus} />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{msg.statusTimestamp}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedMessage(msg)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#243B67] hover:text-white text-[#243B67] rounded font-semibold transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Drilldown Drawer */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedMessage(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Message Delivery Lifecycle</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedMessage.id}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Member:</span>
                  <strong className="text-slate-900">{selectedMessage.employeeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono">{selectedMessage.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp Destination:</span>
                  <span className="font-mono">{selectedMessage.maskedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Campaign:</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.campaignName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Template Used:</span>
                  <span className="font-mono">{selectedMessage.templateName}</span>
                </div>
              </div>

              {/* Status & Error Details */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Provider Status Information</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Current Status:</span>
                    <StatusBadge status={selectedMessage.providerStatus} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Timestamp:</span>
                    <span className="font-mono">{selectedMessage.statusTimestamp}</span>
                  </div>
                  {selectedMessage.errorCode && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                      <div className="font-mono font-bold">Error: {selectedMessage.errorCode}</div>
                      <div className="text-[11px] leading-relaxed">{selectedMessage.errorDescription}</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedMessage.canRetry && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      success('Retry Triggered', `Re-queuing message for ${selectedMessage.employeeName}.`);
                      setSelectedMessage(null);
                    }}
                    className="w-full py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-dispatch Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
