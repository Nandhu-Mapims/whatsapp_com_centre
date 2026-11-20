import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileEdit,
  Plus,
  Search,
  Trash2,
  Copy,
  ArrowRight,
  Clock,
  Send,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockCampaigns } from '../../data/mockData';
import { Campaign } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DraftCampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [drafts, setDrafts] = useState<Campaign[]>(
    mockCampaigns.filter((c) => c.status === 'Draft')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDraft, setConfirmDraft] = useState<Campaign | null>(null);

  const filteredDrafts = drafts.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.templateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDuplicate = (draft: Campaign) => {
    const cloned: Campaign = {
      ...draft,
      id: `cmp-${Date.now()}`,
      campaignId: `CMP-2026-09${drafts.length + 3}`,
      title: `${draft.title} (Copy)`,
      createdAt: '2026-10-30 14:00',
    };
    setDrafts((prev) => [cloned, ...prev]);
    success('Draft Duplicated', `Created duplicate "${cloned.title}".`);
  };

  const handleDelete = () => {
    if (!confirmDraft) return;
    setDrafts((prev) => prev.filter((d) => d.id !== confirmDraft.id));
    success('Draft Deleted', `Draft campaign removed.`);
    setConfirmDraft(null);
  };

  const handleSubmitApproval = (draft: Campaign) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    success(
      'Submitted for Approval',
      `Campaign "${draft.title}" queued for approver sign-off.`
    );
    navigate('/campaigns/approvals');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Draft Campaigns"
        description="Resume incomplete campaign setups, adjust variable mappings, or submit for four-eyes review."
      >
        <button
          onClick={() => navigate('/campaigns/create')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </PageHeader>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search drafts by title, ID, template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total <strong>{filteredDrafts.length}</strong> saved drafts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Draft Title & ID</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Target Audience Scope</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No draft campaigns found. Create a new campaign to begin.
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">{d.campaignId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{d.templateName}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={d.departmentScope}>
                      <span className="text-slate-800 font-medium">{d.categoryScope}</span>
                      <div className="text-[11px] text-slate-400 truncate">{d.departmentScope}</div>
                      {d.designationScope && d.designationScope !== 'ALL' && (
                        <div className="text-[10px] text-[#243B67] font-semibold truncate">
                          🎯 {d.designationScope}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#243B67]" />
                        {d.selectedRecipientsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.createdAt}</td>
                    <td className="py-3 px-4">{d.createdBy}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate('/campaigns/create')}
                          className="px-2.5 py-1 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded font-semibold transition-colors flex items-center gap-1"
                          title="Resume Editing"
                        >
                          <FileEdit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(d)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSubmitApproval(d)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Submit for Approval"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDraft(d)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(confirmDraft)}
        title="Discard Draft Campaign?"
        message={`Are you sure you want to permanently discard "${confirmDraft?.title}"?`}
        confirmLabel="Discard Draft"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDraft(null)}
      />
    </div>
  );
};
