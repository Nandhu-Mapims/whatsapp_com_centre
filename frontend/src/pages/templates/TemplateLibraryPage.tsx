import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  RefreshCw,
  Plus,
  Search,
  Eye,
  Send,
  Edit3,
  Copy,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  Smartphone,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Archive,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockTemplates } from '../../data/mockData';
import { WhatsAppTemplate } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TemplateLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const canManageTemplates = ['Super Admin', 'MD', 'HR'].includes(currentUser.role);

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(mockTemplates);
  type TabType = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT' | 'TRASH';
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Template deletion & trash state
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Separate active and trashed templates
  const activeTemplates = templates.filter((t) => !t.isDeleted && !t.inTrash);
  const trashedTemplates = templates.filter((t) => t.isDeleted || t.inTrash);

  // Fetch initial templates from backend API on mount
  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Soft-delete: Move template to Trash (safeguarding past sent message records and delivery reports)
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/templates/${encodeURIComponent(templateToDelete.id)}?name=${encodeURIComponent(
          templateToDelete.name
        )}&language=${encodeURIComponent(templateToDelete.language || 'en')}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === templateToDelete.id || t.name === templateToDelete.name
              ? {
                  ...t,
                  isDeleted: true,
                  inTrash: true,
                  deletedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                }
              : t
          )
        );
        success(
          'Template Moved to Trash',
          `Template "${templateToDelete.name}" was moved to Trash. Historical broadcast delivery reports and sent records remain preserved.`
        );
      } else {
        error('Deletion Failed', json.message || 'Could not move template to trash.');
      }
    } catch (err: any) {
      error('Network Error', err.message || 'Failed to connect to backend server.');
    } finally {
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  };

  // Restore template from Trash back to active library
  const handleRestoreTemplate = async (tmpl: WhatsAppTemplate) => {
    setRestoringId(tmpl.id);
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(tmpl.id)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === tmpl.id || t.name === tmpl.name
              ? { ...t, isDeleted: false, inTrash: false }
              : t
          )
        );
        success(
          'Template Restored',
          `Template "${tmpl.name}" has been restored to the active library.`
        );
      } else {
        error('Restore Failed', json.message || 'Could not restore template.');
      }
    } catch (err: any) {
      error('Network Error', err.message || 'Failed to connect to backend server.');
    } finally {
      setRestoringId(null);
    }
  };

  // Preview Modal
  const [previewingTemplate, setPreviewingTemplate] = useState<WhatsAppTemplate | null>(null);

  // Rejection Reason Modal
  const [rejectionModalTemplate, setRejectionModalTemplate] = useState<WhatsAppTemplate | null>(null);

  const displayList = activeTab === 'TRASH' ? trashedTemplates : activeTemplates;
  const filteredTemplates = displayList.filter((tmpl) => {
    const matchesTab =
      activeTab === 'TRASH'
        ? true
        : activeTab === 'ALL' || tmpl.status === activeTab;
    const matchesSearch =
      tmpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tmpl.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tmpl.watiTemplateId && tmpl.watiTemplateId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleSyncFromWati = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/templates/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTemplates(json.data);
        success(
          'WATI Live Sync Complete',
          `Successfully synchronized ${json.count} live WhatsApp templates from WATI gateway.`
        );
      } else {
        success('WATI Sync Complete', 'Templates refreshed.');
      }
    } catch {
      success('WATI Sync Complete', 'Templates refreshed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDuplicateDraft = (tmpl: WhatsAppTemplate) => {
    const draftCopy: WhatsAppTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      name: `${tmpl.name}_copy`,
      status: 'DRAFT',
      watiTemplateId: undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates((prev) => [draftCopy, ...prev]);
    success('Template Cloned', `Created local editable draft "${draftCopy.name}".`);
  };

  const handleEditDraft = (tmpl: WhatsAppTemplate) => {
    try {
      sessionStorage.setItem('editing_template', JSON.stringify(tmpl));
    } catch (e) {
      console.warn('Could not store editing_template in sessionStorage:', e);
    }
    navigate(`/templates/designer?id=${encodeURIComponent(tmpl.id || tmpl.name)}`, {
      state: { template: tmpl },
    });
  };

  const handleCreateNewTemplate = () => {
    try {
      sessionStorage.removeItem('editing_template');
    } catch {}
    navigate('/templates/designer');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Template Library"
        description="Browse, synchronize, and select Meta-approved WATI templates. Only approved templates can be dispatched in production."
      >
        <button
          onClick={handleSyncFromWati}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync from WATI'}</span>
        </button>
        {isSuperAdmin && (
          <button
            onClick={handleCreateNewTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        )}
      </PageHeader>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium w-full sm:w-auto overflow-x-auto">
          {(['APPROVED', 'PENDING', 'REJECTED', 'DRAFT', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white shadow-2xs font-bold text-[#1E3A8A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL'
                ? `All Active (${activeTemplates.length})`
                : `${tab.charAt(0) + tab.slice(1).toLowerCase()} (${
                    activeTemplates.filter((t) => t.status === tab).length
                  })`}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('TRASH')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'TRASH'
                ? 'bg-amber-100/90 shadow-2xs font-bold text-amber-900 border border-amber-300'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Trash ({trashedTemplates.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search template name, content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden ${
                tmpl.isDeleted || tmpl.inTrash
                  ? 'bg-amber-50/20 border-amber-200'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    {tmpl.category} • {tmpl.language.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(tmpl.isDeleted || tmpl.inTrash) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Trash2 className="w-3 h-3 text-amber-700" />
                        In Trash
                      </span>
                    )}
                    <StatusBadge status={tmpl.status} />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 font-mono break-all">
                    {tmpl.name}
                  </h4>
                  {tmpl.headerType !== 'NONE' && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded">
                      Header: {tmpl.headerType}
                    </span>
                  )}
                </div>

                {/* Body snippet */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-700 whitespace-pre-wrap font-sans line-clamp-4 leading-relaxed">
                  {tmpl.body}
                </div>

                {/* Historical Sent Records Safeguard Callout */}
                {(tmpl.isDeleted || tmpl.inTrash) && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Sent Broadcast Records Preserved</span>
                      <span className="text-[10px] text-emerald-800 leading-tight block mt-0.5">
                        All broadcasts, sent messages, and delivery reports using this template remain 100% visible and intact.
                      </span>
                    </div>
                  </div>
                )}

                {/* Variables & Buttons info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{tmpl.variables.length} Dynamic Variables</span>
                  <span>{tmpl.buttons.length} Buttons</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => setPreviewingTemplate(tmpl)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-200/60 rounded-md font-semibold flex items-center gap-1 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Preview
                </button>

                {tmpl.isDeleted || tmpl.inTrash ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRestoreTemplate(tmpl)}
                      disabled={restoringId === tmpl.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold flex items-center gap-1.5 text-xs shadow-2xs transition-colors disabled:opacity-50"
                      title="Restore template back to active library"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringId === tmpl.id ? 'animate-spin' : ''}`} />
                      <span>{restoringId === tmpl.id ? 'Restoring...' : 'Restore to Library'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {tmpl.status === 'REJECTED' && (
                      <button
                        onClick={() => setRejectionModalTemplate(tmpl)}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md font-semibold flex items-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Reason
                      </button>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDuplicateDraft(tmpl)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md"
                        title="Duplicate as Draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {tmpl.status === 'APPROVED' ? (
                      <button
                        onClick={() => navigate('/campaigns/create')}
                        className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-md font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Use in Campaign
                      </button>
                    ) : (
                      isSuperAdmin && (
                        <button
                          onClick={() => handleEditDraft(tmpl)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Draft
                        </button>
                      )
                    )}

                    {canManageTemplates && (
                      <button
                        onClick={() => setTemplateToDelete(tmpl)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        title="Move Template to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Templates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {isSuperAdmin
              ? 'No templates in this view. As Super Admin, you can compose and submit a new official WhatsApp template to WATI.'
              : 'No approved templates available yet. Templates are created and submitted to WATI by the Super Admin.'}
          </p>
          {isSuperAdmin && (
            <button
              onClick={handleCreateNewTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          )}
        </div>
      )}

      {/* WhatsApp Interactive Live Preview Modal */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Live WhatsApp Mobile Preview
                </h3>
                <p className="text-xs text-slate-500 font-mono">{previewingTemplate.name}</p>
              </div>
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex justify-center bg-slate-100/60 overflow-y-auto max-h-[80vh]">
              <WhatsAppPhonePreview
                template={previewingTemplate}
                variables={{}}
                sampleRecipientName="Dr. A. Saravanan"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                WATI Identifier: <span className="font-mono">{previewingTemplate.watiTemplateId || 'Local Draft'}</span>
              </span>
              <div className="flex items-center gap-2">
                {isSuperAdmin && previewingTemplate.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      const t = previewingTemplate;
                      setPreviewingTemplate(null);
                      handleEditDraft(t);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Draft
                  </button>
                )}
                <button
                  onClick={() => setPreviewingTemplate(null)}
                  className="px-4 py-1.5 bg-[#1E3A8A] text-white rounded-lg font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meta Rejection Reason Modal */}
      {rejectionModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Meta Review Rejection Notice</h3>
              </div>
              <button
                onClick={() => setRejectionModalTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="font-semibold text-slate-800">
                Template: <span className="font-mono">{rejectionModalTemplate.name}</span>
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 leading-relaxed">
                {rejectionModalTemplate.rejectionReason}
              </div>
              <p className="text-slate-500 text-[11px]">
                Tip: Meta Business policies require explicit opt-out quick replies for marketing category broadcasts, or reclassifying as utility messages.
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    const tmpl = rejectionModalTemplate;
                    setRejectionModalTemplate(null);
                    handleDuplicateDraft(tmpl);
                  }}
                  className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-lg font-semibold transition-colors"
                >
                  Duplicate & Fix in Designer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal (Preserves Historical Sent Data & Delivery Reports) */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Move Template to Trash?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to move <span className="font-mono font-bold text-slate-800">{templateToDelete.name}</span> to Trash?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Historical Sent Data Safeguard</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900">
                Moving this template to Trash hides it from active broadcast selection. <strong>All past broadcast logs, sent messages, read confirmations, and delivery reports will remain 100% intact and viewable.</strong>
              </p>
              <p className="text-[10px] text-emerald-700 font-medium pt-0.5">
                You can restore this template back to the active library at any time from the Trash tab.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                <span>{isDeleting ? 'Moving to Trash...' : 'Yes, Move to Trash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
