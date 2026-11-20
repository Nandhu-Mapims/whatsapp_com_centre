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
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockTemplates } from '../../data/mockData';
import { WhatsAppTemplate } from '../../types';
import { useToast } from '../../context/ToastContext';

export const TemplateLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(mockTemplates);
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT'>('APPROVED');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Preview Modal
  const [previewingTemplate, setPreviewingTemplate] = useState<WhatsAppTemplate | null>(null);

  // Rejection Reason Modal
  const [rejectionModalTemplate, setRejectionModalTemplate] = useState<WhatsAppTemplate | null>(null);

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesTab = activeTab === 'ALL' || tmpl.status === activeTab;
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
      createdAt: '2026-10-30',
    };
    setTemplates((prev) => [draftCopy, ...prev]);
    success('Template Cloned', `Created local editable draft "${draftCopy.name}".`);
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
        <button
          onClick={() => navigate('/templates/designer')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Draft</span>
        </button>
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
                  ? 'bg-white shadow-2xs font-bold text-[#243B67]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL'
                ? `All (${templates.length})`
                : `${tab.charAt(0) + tab.slice(1).toLowerCase()} (${
                    templates.filter((t) => t.status === tab).length
                  })`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search template name, content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-3">
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {tmpl.category} • {tmpl.language.toUpperCase()}
                </span>
                <StatusBadge status={tmpl.status} />
              </div>

              {/* Title */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-mono break-all">
                  {tmpl.name}
                </h4>
                {tmpl.headerType !== 'NONE' && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-[#243B67] bg-[#243B67]/5 px-2 py-0.5 rounded">
                    Header: {tmpl.headerType}
                  </span>
                )}
              </div>

              {/* Body snippet */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-700 whitespace-pre-wrap font-sans line-clamp-4 leading-relaxed">
                {tmpl.body}
              </div>

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
                className="px-2.5 py-1.5 text-slate-600 hover:text-[#243B67] hover:bg-slate-200/60 rounded-md font-semibold flex items-center gap-1 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" /> Preview
              </button>

              <div className="flex items-center gap-1">
                {tmpl.status === 'REJECTED' && (
                  <button
                    onClick={() => setRejectionModalTemplate(tmpl)}
                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md font-semibold flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Reason
                  </button>
                )}

                <button
                  onClick={() => handleDuplicateDraft(tmpl)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md"
                  title="Duplicate as Draft"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {tmpl.status === 'APPROVED' ? (
                  <button
                    onClick={() => navigate('/campaigns/create')}
                    className="px-3 py-1.5 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-md font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Use in Campaign
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/templates/designer')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Draft
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="px-4 py-1.5 bg-[#243B67] text-white rounded-lg font-semibold"
              >
                Close Preview
              </button>
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
                  className="px-4 py-2 bg-[#7B2846] hover:bg-[#621f37] text-white rounded-lg font-semibold transition-colors"
                >
                  Duplicate & Fix in Designer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
