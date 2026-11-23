import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  Search,
  Calendar,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockCampaigns } from '../../data/mockData';
import { Campaign } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ScheduleCampaignsPage: React.FC = () => {
  const { success } = useToast();

  const [scheduledCampaigns, setScheduledCampaigns] = useState<Campaign[]>(
    mockCampaigns.filter((c) => c.status === 'Scheduled')
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Reschedule modal state
  const [rescheduleCampaign, setRescheduleCampaign] = useState<Campaign | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState('2026-11-01T10:00');

  // Cancel dispatch dialog state
  const [cancelTarget, setCancelTarget] = useState<Campaign | null>(null);

  const filtered = scheduledCampaigns.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.campaignId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleCampaign) return;

    setScheduledCampaigns((prev) =>
      prev.map((c) =>
        c.id === rescheduleCampaign.id ? { ...c, scheduledAt: newScheduleTime.replace('T', ' ') } : c
      )
    );
    success(
      'Broadcast Rescheduled',
      `Campaign "${rescheduleCampaign.title}" moved to ${newScheduleTime}. Consent will be re-evaluated at dispatch time.`
    );
    setRescheduleCampaign(null);
  };

  const handleCancelDispatch = () => {
    if (!cancelTarget) return;

    setScheduledCampaigns((prev) => prev.filter((c) => c.id !== cancelTarget.id));
    success('Broadcast Cancelled', `Scheduled dispatch for "${cancelTarget.title}" stopped.`);
    setCancelTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled WhatsApp Campaigns"
        description="Monitor automated future dispatches queued in Redis/BullMQ. Staff opt-out and consent validity are verified in real-time immediately before trigger."
      />

      {/* Consent re-verification banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900 text-xs">
        <Clock className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Automated Pre-Dispatch Integrity Check:</strong> All scheduled campaigns undergo an automated recipient consent re-scan immediately prior to transmitting to WATI. Any employee who records an opt-out between scheduling and dispatch will be automatically suppressed.
        </div>
      </div>

      {/* Scheduled Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search scheduled campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total <strong>{filtered.length}</strong> upcoming broadcasts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Campaign Title & ID</th>
                <th className="py-3 px-4">Target Scope</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4">Scheduled Date & Time (IST)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No campaigns currently scheduled.
                  </td>
                </tr>
              ) : (
                filtered.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cmp.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">{cmp.campaignId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{cmp.categoryScope}</div>
                      <div className="text-[11px] text-slate-400">{cmp.departmentScope}</div>
                      {cmp.designationScope && cmp.designationScope !== 'ALL' && (
                        <div className="text-[10px] text-[#1E3A8A] font-semibold truncate">
                          🎯 {cmp.designationScope}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        {cmp.selectedRecipientsCount} staff
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cmp.approvedBy}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <span className="flex items-center gap-1 text-[#1E3A8A] bg-[#1E3A8A]/5 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        {cmp.scheduledAt}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cmp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRescheduleCampaign(cmp)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors flex items-center gap-1"
                          title="Reschedule"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                        </button>
                        <button
                          onClick={() => setCancelTarget(cmp)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Reschedule Campaign Dispatch</h3>
              <button
                onClick={() => setRescheduleCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-0.5">Campaign Title</label>
                <strong className="text-slate-900">{rescheduleCampaign.title}</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Scheduled Date & Time (Asia/Kolkata IST) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                Rescheduling maintains the approved recipient snapshot and template parameters.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleCampaign(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel Scheduled Broadcast?"
        message={`Are you sure you want to stop the scheduled dispatch for "${cancelTarget?.title}"? Messages will not be transmitted to WATI.`}
        confirmLabel="Cancel Dispatch"
        variant="danger"
        onConfirm={handleCancelDispatch}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};
