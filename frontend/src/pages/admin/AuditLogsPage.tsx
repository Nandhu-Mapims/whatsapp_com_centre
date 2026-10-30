import React, { useState } from 'react';
import {
  FileSearch,
  Search,
  Filter,
  Download,
  Shield,
  Eye,
  Clock,
  User,
  Activity,
  X,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockAuditLogs } from '../../data/mockData';
import { AuditLog } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AuditLogsPage: React.FC = () => {
  const { success } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Audit Trail & Compliance Log"
        description="Tamper-evident chronological log of employee modifications, campaign approvals, WATI dispatches, and credential updates."
      >
        <button
          onClick={() => success('Audit Trail Exported', 'Downloading cryptographically verifiable audit extract.')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </PageHeader>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search actor, action, resource ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            >
              <option value="ALL">All Modules</option>
              <option value="Campaign Management">Campaign Management</option>
              <option value="Employee Management">Employee Management</option>
              <option value="WhatsApp Templates">WhatsApp Templates</option>
              <option value="Consent & Opt-Outs">Consent & Opt-Outs</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total <strong>{filtered.length}</strong> events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{log.actor}</div>
                    <div className="text-[11px] text-slate-400">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#243B67]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.module}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                      {log.resourceId}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#243B67] hover:text-white text-[#243B67] rounded font-semibold transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Audit Record Detail</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono">{selectedLog.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actor:</span>
                  <strong className="text-slate-900">{selectedLog.actor}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-[#243B67]">{selectedLog.actorRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Action:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin IP:</span>
                  <span className="font-mono">{selectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Payload & Event Details</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800">
                  {selectedLog.details}
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-slate-500 text-[11px] leading-relaxed">
                🔒 Cryptographic Integrity Verified: This event entry is read-only, signed by the application security subsystem, and cannot be modified or deleted.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
