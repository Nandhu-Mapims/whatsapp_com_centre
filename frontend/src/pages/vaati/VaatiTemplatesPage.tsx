import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Search,
  Send,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Phone,
  Layers,
  Sparkles,
  Radio,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { VaatiTemplate } from '../../types/vaati';
import { VaatiFormatBadge } from '../../components/vaati/VaatiFormatEditor';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const VaatiTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const { currentUser } = useAuth();

  const [templates, setTemplates] = useState<VaatiTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Gateway status & reply counts
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [isTogglingGateway, setIsTogglingGateway] = useState(false);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [totalRepliesCount, setTotalRepliesCount] = useState(0);
  const [togglingReplyId, setTogglingReplyId] = useState<string | null>(null);

  // Quick Test Modal state
  const [testModalTemplate, setTestModalTemplate] = useState<VaatiTemplate | null>(null);
  const [testPhone, setTestPhone] = useState('+91 95513 82296');
  const [testVariableValues, setTestVariableValues] = useState<Record<string, string>>({});
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchTemplates = () => {
    setIsLoading(true);
    fetch('/api/vaati/templates', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load VAATI templates:', err);
      })
      .finally(() => setIsLoading(false));
  };

  const fetchGatewayStatus = () => {
    fetch('/api/gateway/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setGatewayStatus(json.data);
        }
      })
      .catch((err) => console.warn('Could not fetch gateway status:', err));
  };

  const fetchReplyCounts = () => {
    fetch('/api/vaati/replies', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReplyCounts(json.countsByTemplate || {});
          setTotalRepliesCount(json.totalReplies || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTemplates();
    fetchGatewayStatus();
    fetchReplyCounts();
  }, []);

  const handleToggleVaati = async (enable: boolean) => {
    setIsTogglingGateway(true);
    try {
      const res = await fetch('/api/gateway/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ gateway: 'VAATI', enabled: enable }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        success('Gateway Updated', json.message);
        fetchGatewayStatus();
      } else {
        error('Toggle Failed', json.message || 'Could not toggle VAATI gateway.');
      }
    } catch (err: any) {
      error('Network Error', err.message);
    } finally {
      setIsTogglingGateway(false);
    }
  };

  const handleDeleteTemplate = async (template: VaatiTemplate) => {
    if (!confirm(`Are you sure you want to delete template "${template.title}"?`)) return;

    try {
      const res = await fetch(`/api/vaati/templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        success('Template Deleted', `Template "${template.title}" removed.`);
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      } else {
        error('Delete Failed', json.message || 'Could not delete template.');
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleDuplicateTemplate = async (template: VaatiTemplate) => {
    try {
      const copyPayload = {
        title: `${template.title} (Copy)`,
        category: template.category,
        messageType: template.messageType || 'text',
        header: template.header,
        body: template.body,
        footer: template.footer,
        ctaUrl: template.ctaUrl,
        mediaUrl: template.mediaUrl,
        mediaFilename: template.mediaFilename,
        mediaMimetype: template.mediaMimetype,
        pollOptions: template.pollOptions,
        multipleAnswers: template.multipleAnswers,
        allowReplies: Boolean(template.allowReplies),
        replyPrompt: template.replyPrompt,
        variables: template.variables,
      };

      const res = await fetch('/api/vaati/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(copyPayload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        success('Template Duplicated', `Created copy "${copyPayload.title}".`);
        fetchTemplates();
      } else {
        error('Duplicate Failed', json.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleToggleReplySetting = async (template: VaatiTemplate) => {
    const nextAllow = !Boolean(template.allowReplies);
    setTogglingReplyId(template.id);
    try {
      const res = await fetch(
        `/api/vaati/templates/${encodeURIComponent(template.id)}/reply-toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({ allowReplies: nextAllow }),
        }
      );
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? json.data : t)));
        success(
          `Replies ${nextAllow ? 'ON' : 'OFF'}`,
          `User replies are now ${nextAllow ? 'enabled (saved to DB)' : 'disabled'} for "${template.title}".`
        );
      } else {
        error('Update Failed', json.message || 'Could not update reply setting.');
      }
    } catch (err: any) {
      error('Network Error', err.message);
    } finally {
      setTogglingReplyId(null);
    }
  };

  const handleOpenTestModal = (template: VaatiTemplate) => {
    setTestModalTemplate(template);
    setTestResult(null);
    const initialVals: Record<string, string> = {};
    (template.variables || []).forEach((v) => {
      initialVals[v.key] = v.sampleValue || '';
    });
    setTestVariableValues(initialVals);
  };

  const handleSendQuickTest = async () => {
    if (!testModalTemplate) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/vaati/templates/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          whatsappNumber: testPhone,
          templateId: testModalTemplate.id,
          messageType: testModalTemplate.messageType || (testModalTemplate.pollOptions?.length ? 'poll' : 'text'),
          ctaUrl: testModalTemplate.ctaUrl,
          mediaUrl: testModalTemplate.mediaUrl,
          mediaFilename: testModalTemplate.mediaFilename,
          mediaMimetype: testModalTemplate.mediaMimetype,
          pollOptions: testModalTemplate.pollOptions,
          multipleAnswers: testModalTemplate.multipleAnswers,
          allowReplies: Boolean(testModalTemplate.allowReplies),
          replyPrompt: testModalTemplate.replyPrompt,
          body: testModalTemplate.body,
          footer: testModalTemplate.footer,
          variables: testModalTemplate.variables,
          values: testVariableValues,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTestResult({
          success: true,
          message: json.message,
          providerMessageId: json.providerMessageId,
          renderedText: json.renderedText,
        });
        success('Test Dispatched', `Delivered via VAATI to ${testPhone}!`);
      } else {
        setTestResult({
          success: false,
          message: json.message || 'Failed to dispatch via VAATI.',
        });
        error('Test Failed', json.message);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error.',
      });
      error('Error', err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="VAATI Templates Studio"
        description="Create, edit, and broadcast your own custom WhatsApp templates. Self-hosted • Zero Meta template approval fees • Instant activation."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/vaati/replies')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-emerald-300"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Replies Inbox ({totalRepliesCount})</span>
          </button>
          <button
            onClick={() => navigate('/vaati/gateway')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-slate-300"
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Node Status</span>
          </button>
          <button
            onClick={() => navigate('/vaati/templates/create')}
            className="px-4 py-2 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create VAATI Template</span>
          </button>
        </div>
      </PageHeader>

      {/* Gateway Live Status Callout Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C76323] text-white flex items-center justify-center font-black text-lg shadow-xs">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                VAATI Self-Hosted WhatsApp Engine
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                Independent Node
              </span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  gatewayStatus?.isVaatiEnabled && gatewayStatus?.vaati?.online
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold">
                {gatewayStatus?.isVaatiEnabled
                  ? gatewayStatus?.vaati?.online
                    ? `Linked: ${gatewayStatus?.vaati?.phone || 'Online'} (${gatewayStatus?.vaati?.pushName || 'Karthi'})`
                    : 'Engine Starting...'
                  : 'VAATI Gateway Turned OFF'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-bold">Zero Meta Conversation Charges</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isTogglingGateway}
            onClick={() => handleToggleVaati(!gatewayStatus?.isVaatiEnabled)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-2xs ${
              gatewayStatus?.isVaatiEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                gatewayStatus?.isVaatiEnabled ? 'bg-white animate-pulse' : 'bg-rose-600'
              }`}
            />
            <span>{gatewayStatus?.isVaatiEnabled ? 'VAATI Gateway: ACTIVE' : 'VAATI Gateway: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Custom Templates
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {templates.length} Active
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            ✓ Ready for mass dispatch
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Meta Approval
          </span>
          <span className="text-xl font-extrabold text-amber-700 mt-1 block">
            Not Required
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            Instant live publishing
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Cost Per Message
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            ₹0.00 / Free
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            No Meta per-session fees
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Active Node
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block truncate">
            {gatewayStatus?.vaati?.phone || '+91 99624 60782'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block truncate">
            {gatewayStatus?.vaati?.pushName || 'Karthi'} (Port 3001)
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C76323] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VAATI templates..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C76323]"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#C76323]" />
          <span className="text-xs font-semibold">Loading VAATI templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#C76323] flex items-center justify-center mx-auto text-xl font-bold">
            ⚡
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">No VAATI Templates Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No templates matched "${searchQuery}". Try a different keyword.`
              : 'Create your first custom template for hospital applications, duty rosters, or alerts without Meta approval!'}
          </p>
          <button
            onClick={() => navigate('/vaati/templates/create')}
            className="px-4 py-2 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create VAATI Template Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">{template.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {template.category}
                    </span>
                    <VaatiFormatBadge
                      messageType={
                        template.messageType ||
                        (template.pollOptions && template.pollOptions.length >= 2 ? 'poll' : 'text')
                      }
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    ID: {template.name}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={togglingReplyId === template.id}
                    onClick={() => handleToggleReplySetting(template)}
                    title={
                      template.allowReplies
                        ? 'Replies are ON — Click to turn OFF'
                        : 'Replies are OFF — Click to turn ON so users can reply'
                    }
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                      template.allowReplies
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <MessageSquare
                      className={`w-3 h-3 ${
                        template.allowReplies ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>Reply: {template.allowReplies ? 'ON' : 'OFF'}</span>
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Ready</span>
                  </span>
                </div>
              </div>

              {/* Message Preview Body */}
              <div className="p-4 flex-1 space-y-3">
                {template.header && (
                  <div className="font-bold text-slate-800 text-xs pb-1 border-b border-slate-100">
                    {template.header}
                  </div>
                )}
                <div className="p-3 bg-[#EFEAE2]/60 rounded-xl border border-slate-200/60 font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed shadow-inner">
                  {template.body}
                </div>
                {template.ctaUrl && (
                  <div className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 truncate">
                    🌐 {template.ctaUrl}
                  </div>
                )}
                {template.mediaUrl && (
                  <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold truncate">
                    {template.messageType === 'pdf_text' ? '📄 PDF: ' : '🖼️ Image: '}
                    {template.mediaFilename || (template.mediaUrl.startsWith('data:') ? 'Uploaded File' : template.mediaUrl)}
                  </div>
                )}
                {Array.isArray(template.pollOptions) && template.pollOptions.length >= 2 && (
                  <div className="flex flex-wrap gap-1.5">
                    {template.pollOptions.map((opt, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 shadow-2xs"
                      >
                        🔘 {opt}
                      </span>
                    ))}
                  </div>
                )}
                {template.footer && (
                  <div className="text-[10px] text-slate-400 font-medium italic">
                    Footer: {template.footer}
                  </div>
                )}

                {/* Variables list */}
                {template.variables && template.variables.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                      Placeholders ({template.variables.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {template.variables.map((v) => (
                        <span
                          key={v.key}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200"
                          title={v.description}
                        >
                          {'{{' + v.key + '}}'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenTestModal(template)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg font-bold text-[11px] border border-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Send className="w-3 h-3 text-[#C76323]" />
                    <span>Quick Test</span>
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/campaigns/create?gateway=VAATI&templateId=${encodeURIComponent(
                          template.id
                        )}`
                      )
                    }
                    className="px-2.5 py-1.5 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use in Broadcast</span>
                  </button>
                  {(template.allowReplies || (replyCounts[template.id] || replyCounts[template.name] || 0) > 0) && (
                    <button
                      onClick={() =>
                        navigate(`/vaati/replies?templateId=${encodeURIComponent(template.id)}`)
                      }
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>
                        Replies ({replyCounts[template.id] || replyCounts[template.name] || 0})
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate template"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/vaati/templates/create?edit=${template.id}`)}
                    title="Edit template"
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    title="Delete template"
                    className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Test Modal */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Send Test via VAATI Gateway
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    ⚡ Self-Hosted
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Template: {testModalTemplate.title}
                </div>
              </div>
              <button
                onClick={() => setTestModalTemplate(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Test Phone Input */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">
                WhatsApp Destination Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. +91 95513 82296"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                />
              </div>
              <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                🧪 Safe sandbox active: dispatches locked to authorized test handset.
              </span>
            </div>

            {/* Variable inputs */}
            {testModalTemplate.variables && testModalTemplate.variables.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto pr-1">
                <label className="block font-bold text-slate-700 text-xs">
                  Fill Dynamic Parameters:
                </label>
                {testModalTemplate.variables.map((v) => (
                  <div key={v.key} className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-600 font-semibold block">
                      {'{{' + v.key + '}}'} ({v.description || v.key}):
                    </span>
                    <input
                      type="text"
                      value={testVariableValues[v.key] ?? v.sampleValue ?? ''}
                      onChange={(e) =>
                        setTestVariableValues((prev) => ({ ...prev, [v.key]: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Test Result callout */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.providerMessageId && (
                    <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                      Message ID: {testResult.providerMessageId}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTestModalTemplate(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSendingTest}
                onClick={handleSendQuickTest}
                className="px-4 py-2 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-60"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending via VAATI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VaatiTemplatesPage;
