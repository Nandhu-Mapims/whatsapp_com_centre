import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FileCheck,
  Smartphone,
  X,
  MessageSquare,
  AlertCircle,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockCampaigns, mockTemplates, mockEmployees } from '../../data/mockData';
import { Campaign, WhatsAppTemplate } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const CampaignApprovalPage: React.FC = () => {
  const { success, error, warning } = useToast();
  const { currentUser } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [activeTab, setActiveTab] = useState<'Pending Approval' | 'Approved' | 'Rejected'>('Pending Approval');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected campaign for split review
  const [reviewCampaign, setReviewCampaign] = useState<Campaign | null>(null);

  // Approve confirmation dialog state
  const [approveConfirmTarget, setApproveConfirmTarget] = useState<Campaign | null>(null);

  // Reject modal state
  const [rejectModalTarget, setRejectModalTarget] = useState<Campaign | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesTab = c.status === activeTab;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Get matching template object for preview
  const getTemplateForCampaign = (templateId: string): WhatsAppTemplate => {
    const found = mockTemplates.find((t) => t.id === templateId);
    if (found) return found;
    return {
      id: templateId || 'tmpl-default',
      name: 'APH Connect Broadcast',
      category: 'UTILITY',
      language: 'en',
      headerType: 'NONE',
      body: 'Official Hospital Broadcast Notification.',
      footer: 'APH Connect • MAPIMS Hospitals',
      buttons: [],
      variables: [],
      status: 'APPROVED',
      createdAt: '2026-11-20',
    };
  };

  // Separation of duties check
  const isCreatorOfCampaign = (cmp: Campaign) => {
    return cmp.createdById === currentUser.id || cmp.createdBy === currentUser.name;
  };

  const handleOpenApprove = (cmp: Campaign) => {
    if (isCreatorOfCampaign(cmp)) {
      warning(
        'Self-Approval Blocked',
        'Hospital governance prohibits creators from approving their own campaigns. Please switch to an Approver or Super Admin role in the topbar.'
      );
      return;
    }
    setApproveConfirmTarget(cmp);
  };

  const handleConfirmApprove = () => {
    if (!approveConfirmTarget) return;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === approveConfirmTarget.id
          ? {
              ...c,
              status: 'Approved',
              approvedBy: currentUser.name,
              approvedAt: '2026-10-30 14:50',
            }
          : c
      )
    );

    success(
      'Campaign Approved',
      `"${approveConfirmTarget.title}" approved by ${currentUser.name}. Ready for dispatch.`
    );
    setApproveConfirmTarget(null);
    setReviewCampaign(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalTarget) return;

    if (!rejectionComment.trim()) {
      error('Reason Required', 'You must provide a clear rejection or revision reason.');
      return;
    }

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === rejectModalTarget.id
          ? {
              ...c,
              status: 'Rejected',
              approvedBy: currentUser.name,
              rejectionComment,
            }
          : c
      )
    );

    warning(
      'Campaign Rejected',
      `"${rejectModalTarget.title}" sent back to creator drafts with feedback.`
    );
    setRejectModalTarget(null);
    setRejectionComment('');
    setReviewCampaign(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Approval Queue"
        description="Four-eyes governance workflow. Authorizing clinical directors and administrative approvers review message content and audience before bulk transmission."
      />

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {(['Pending Approval', 'Approved', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setReviewCampaign(null);
              }}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white shadow-2xs font-bold text-[#1E3A8A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab} (
              {campaigns.filter((c) => c.status === tab).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, requester, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>
      </div>

      {/* Main Queue & Review Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Table of campaigns in active tab */}
        <div
          className={`${
            reviewCampaign ? 'lg:col-span-6' : 'lg:col-span-12'
          } bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Campaign Title & ID</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No campaigns found in "{activeTab}".
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((cmp) => {
                    const isSelf = isCreatorOfCampaign(cmp);
                    return (
                      <tr
                        key={cmp.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          reviewCampaign?.id === cmp.id ? 'bg-[#1E3A8A]/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{cmp.title}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {cmp.campaignId} • {cmp.createdAt}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{cmp.createdBy}</div>
                          {isSelf && (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              (Created by you)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            {cmp.selectedRecipientsCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={cmp.priority} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setReviewCampaign(cmp)}
                            className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded font-semibold transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detailed Review & Four-Eyes Approval Panel */}
        {reviewCampaign && (
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md space-y-5 text-xs animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {reviewCampaign.campaignId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {reviewCampaign.title}
                </h3>
              </div>
              <button
                onClick={() => setReviewCampaign(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Separation of duties warning if creator tries to self-approve */}
            {isCreatorOfCampaign(reviewCampaign) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Separation of Duties Restriction:</strong> You created this campaign. Under MAPIMS hospital security policy, creators cannot approve their own messages. Please assign an independent approver or switch role to Approver/Super Admin.
                </div>
              </div>
            )}

            {/* Recipient Breakdown Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="font-bold text-slate-800">Target Audience Scope</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                <div>
                  <span className="text-[11px] text-slate-400 block">Category</span>
                  <strong className="text-slate-900 block truncate">{reviewCampaign.categoryScope}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <strong className="text-slate-900 block truncate">{reviewCampaign.departmentScope}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Designation</span>
                  <strong className="text-slate-900 block truncate">
                    {reviewCampaign.designationScope && reviewCampaign.designationScope !== 'ALL'
                      ? reviewCampaign.designationScope
                      : 'All Designations'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-semibold">
                <span>Eligible Consented Staff:</span>
                <span className="text-emerald-700 font-extrabold text-sm">
                  {reviewCampaign.selectedRecipientsCount} recipients
                </span>
              </div>
            </div>

            {/* WhatsApp Preview in Review */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#1E3A8A]" />
                Live Message Layout
              </h4>
              <div className="p-3 bg-slate-100/70 rounded-2xl flex justify-center border border-slate-200">
                <WhatsAppPhonePreview
                  template={getTemplateForCampaign(reviewCampaign.templateId)}
                  variables={reviewCampaign.templateVariables}
                  sampleRecipientName="Dr. A. Saravanan (Sample)"
                />
              </div>
            </div>

            {/* Action Bar for Approver */}
            {activeTab === 'Pending Approval' && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalTarget(reviewCampaign)}
                  className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject / Request Changes
                </button>
                <button
                  type="button"
                  disabled={isCreatorOfCampaign(reviewCampaign)}
                  onClick={() => handleOpenApprove(reviewCampaign)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" /> Approve Broadcast
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Approval */}
      <ConfirmDialog
        isOpen={Boolean(approveConfirmTarget)}
        title="Authorize Campaign Dispatch?"
        message={`You are approving "${approveConfirmTarget?.title}" for ${approveConfirmTarget?.selectedRecipientsCount} hospital employees. This action binds an immutable revision hash in the audit log.`}
        confirmLabel="Confirm Sign-off"
        variant="primary"
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveConfirmTarget(null)}
      />

      {/* Reject Reason Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Reject Campaign / Request Changes
              </h3>
              <button
                onClick={() => setRejectModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmReject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-0.5">Campaign</label>
                <strong className="text-slate-900">{rejectModalTarget.title}</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Rejection / Revision Required *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify what needs to be changed (e.g. wrong template category, missing reporting venue, incorrect duty roster date)..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
