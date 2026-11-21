import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Calendar,
  ShieldCheck,
  X,
  FileCheck,
  CheckCheck,
  Plus,
  Send,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockCampaigns } from '../../data/mockData';
import { Campaign } from '../../types';
import { useToast } from '../../context/ToastContext';

export const CampaignHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail drawer state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filtered = campaigns.filter((cmp) => {
    const matchesSearch =
      cmp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.templateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cmp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast History & Logs"
        description="Chronological record of all hospital WhatsApp communications, delivery metrics, and dispatch logs."
      >
        <button
          onClick={() => navigate('/campaigns/create')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Broadcast</span>
        </button>
        <button
          onClick={() => success('Export Generated', 'Downloading campaign audit report in Excel format.')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export History (XLSX)</span>
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
                placeholder="Search by title, ID, template..."
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
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Total <strong>{filtered.length}</strong> campaigns recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Campaign Title & ID</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Audience Scope</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((cmp) => (
                <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{cmp.title}</div>
                    <div className="text-[11px] font-mono text-slate-400">{cmp.campaignId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{cmp.templateName}</td>
                  <td className="py-3 px-4 max-w-xs truncate" title={cmp.departmentScope}>
                    <div className="font-medium text-slate-800">{cmp.categoryScope}</div>
                    <div className="text-[11px] text-slate-400 truncate">{cmp.departmentScope}</div>
                    {cmp.designationScope && cmp.designationScope !== 'ALL' && (
                      <div className="text-[10px] text-[#243B67] font-semibold truncate">
                        🎯 {cmp.designationScope}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{cmp.createdAt}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {cmp.approvedBy || <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {cmp.selectedRecipientsCount} staff
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={cmp.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/reports/delivery?campaignId=${cmp.id || cmp.campaignId}`)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-[#243B67] text-[#243B67] hover:text-white rounded font-semibold transition-colors flex items-center gap-1 border border-blue-200"
                        title="View Delivery Report for this Campaign"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                      <button
                        onClick={() => setSelectedCampaign(cmp)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Details Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedCampaign(null)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {selectedCampaign.campaignId}
                  </span>
                  <StatusBadge status={selectedCampaign.status} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">
                  {selectedCampaign.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Quick Action: View Delivery Report */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#243B67] text-xs">Campaign Delivery Breakdown</div>
                  <div className="text-[11px] text-slate-500">
                    Inspect individual recipient delivery states (Sent → Delivered → Read).
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/reports/delivery?campaignId=${selectedCampaign.id || selectedCampaign.campaignId}`)}
                  className="px-3 py-1.5 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>View Delivery Report</span>
                </button>
              </div>

              {/* Delivery Stats if Sent */}
              {selectedCampaign.submittedCount > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">Broadcast Performance</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Submitted</span>
                      <div className="text-base font-bold text-slate-800 mt-0.5">
                        {selectedCampaign.submittedCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Delivered</span>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">
                        {selectedCampaign.deliveredCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Read Rate</span>
                      <div className="text-base font-bold text-blue-600 mt-0.5">
                        {selectedCampaign.readCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Failed</span>
                      <div className="text-base font-bold text-rose-600 mt-0.5">
                        {selectedCampaign.failedCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Snapshot Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Frozen Recipient Snapshot</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Category</span>
                      <strong className="text-slate-800 block truncate">{selectedCampaign.categoryScope}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Department</span>
                      <strong className="text-slate-800 block truncate">{selectedCampaign.departmentScope}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Designation</span>
                      <strong className="text-slate-800 block truncate">
                        {selectedCampaign.designationScope || 'All'}
                      </strong>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Matching Database Filter:</span>
                    <span className="font-bold text-slate-900">
                      {selectedCampaign.recipientBreakdown.totalMatching}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Eligible Consented Staff:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedCampaign.recipientBreakdown.eligible}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="font-medium">Suppressed Opt-Outs:</span>
                    <span className="font-bold">
                      {selectedCampaign.recipientBreakdown.optedOut}
                    </span>
                  </div>
                </div>
              </div>

              {/* Template Configuration */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Template & Variable Payload</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div>
                    <span className="text-slate-400 font-medium block">Template Name:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedCampaign.templateName}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium block">Substituted Parameters:</span>
                    {Object.entries(selectedCampaign.templateVariables).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#243B67]">{`{{${k}}}`}:</span>
                        <span className="text-slate-800 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Governance & Approval Trail</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">Created by {selectedCampaign.createdBy}</div>
                      <div className="text-[11px] text-slate-400">{selectedCampaign.createdAt}</div>
                    </div>
                  </div>

                  {selectedCampaign.approvedBy && (
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800">
                          Approved by {selectedCampaign.approvedBy}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {selectedCampaign.approvedAt || 'Signed off'}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCampaign.rejectionComment && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                      <strong>Rejection Note:</strong> {selectedCampaign.rejectionComment}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
