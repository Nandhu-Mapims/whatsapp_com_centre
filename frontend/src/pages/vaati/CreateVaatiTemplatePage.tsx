import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap,
  Save,
  Send,
  ArrowLeft,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Copy,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { VaatiTemplate, VaatiVariable, VaatiMessageType } from '../../types/vaati';
import { VaatiFormatEditor, VaatiPreviewAttachment } from '../../components/vaati/VaatiFormatEditor';
import { WhatsAppFormattingToolbar, WhatsAppFormattedText } from '../../components/vaati/WhatsAppFormattingToolbar';
import { useToast } from '../../context/ToastContext';

export const CreateVaatiTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { success, error, warning } = useToast();

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hospital Applications');
  const [messageType, setMessageType] = useState<VaatiMessageType>('text');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState(
    'Melmaruvathur Adhiparasakthi Institute of Medical Sciences (MAPIMS)'
  );
  const [ctaUrl, setCtaUrl] = useState('https://inc.mapims.edu.in/login');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFilename, setMediaFilename] = useState('');
  const [mediaMimetype, setMediaMimetype] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Yes, Confirm 👍',
    'No, Cancel ❌',
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [allowReplies, setAllowReplies] = useState(false);
  const [replyPrompt, setReplyPrompt] = useState(
    '💬 Reply directly to this message to submit your response.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Live test dispatch state
  const [testPhone, setTestPhone] = useState('+91 95513 82296');
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({
    app_name: 'Incident Reporting Application',
    app_url: 'https://inc.mapims.edu.in/login',
    username: 'Your Employee ID',
    password: 'mapims@123',
    'employee.name': 'Dr. A. Saravanan',
  });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Load existing template if editing
  useEffect(() => {
    if (editId) {
      setIsLoadingExisting(true);
      fetch(`/api/vaati/templates/${encodeURIComponent(editId)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const tmpl: VaatiTemplate = json.data;
            setTitle(tmpl.title);
            setName(tmpl.name);
            setCategory(tmpl.category);
            setMessageType(
              tmpl.messageType ||
                ((tmpl.pollOptions && tmpl.pollOptions.length >= 2) ? 'poll' : 'text')
            );
            setHeader(tmpl.header || '');
            setBody(tmpl.body);
            setFooter(tmpl.footer || '');
            setCtaUrl(tmpl.ctaUrl || '');
            setMediaUrl(tmpl.mediaUrl || '');
            setMediaFilename(tmpl.mediaFilename || '');
            setMediaMimetype(tmpl.mediaMimetype || '');
            if (Array.isArray(tmpl.pollOptions) && tmpl.pollOptions.length >= 2) {
              setPollOptions(tmpl.pollOptions);
            }
            setMultipleAnswers(Boolean(tmpl.multipleAnswers));
            setAllowReplies(Boolean(tmpl.allowReplies));
            setReplyPrompt(
              tmpl.replyPrompt || '💬 Reply directly to this message to submit your response.'
            );
            const vals: Record<string, string> = {};
            (tmpl.variables || []).forEach((v) => {
              vals[v.key] = v.sampleValue || '';
            });
            setSampleValues((prev) => ({ ...prev, ...vals }));
          }
        })
        .catch((err) => console.error('Failed to load template:', err))
        .finally(() => setIsLoadingExisting(false));
    }
  }, [editId]);

  // Derive variables from body
  const detectedVariables = useMemo(() => {
    const matches = body.match(/\{\{([a-zA-Z0-9_.-]+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
  }, [body]);

  // Live rendered message for phone preview
  const renderedPreviewText = useMemo(() => {
    let result = body;
    detectedVariables.forEach((key) => {
      const val = sampleValues[key] || `[${key}]`;
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    });
    return result;
  }, [body, detectedVariables, sampleValues]);

  // Save template
  const handleSaveTemplate = async (andCreateCampaign = false) => {
    if (!title.trim()) {
      error('Title Required', 'Please enter a template title.');
      return;
    }
    if (!body.trim()) {
      error('Body Required', 'Please enter the message body.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (messageType === 'poll' && cleanOptions.length < 2) {
        error('Options Required', 'Please provide at least 2 1-Tap response button options.');
        setIsSaving(false);
        return;
      }

      if ((messageType === 'image_text' || messageType === 'pdf_text') && !mediaUrl.trim()) {
        error('Attachment Required', `Please provide a ${messageType === 'pdf_text' ? 'PDF document' : 'image'} URL or upload a file.`);
        setIsSaving(false);
        return;
      }

      const payload = {
        title: title.trim(),
        name: name.trim() || undefined,
        category,
        messageType,
        header: messageType !== 'poll' ? (header.trim() || undefined) : undefined,
        body: body.trim(),
        footer: messageType !== 'poll' ? (footer.trim() || undefined) : undefined,
        ctaUrl: messageType === 'url_text' ? (ctaUrl.trim() || undefined) : undefined,
        mediaUrl: messageType === 'image_text' || messageType === 'pdf_text' ? mediaUrl.trim() : undefined,
        mediaFilename: messageType === 'image_text' || messageType === 'pdf_text' ? (mediaFilename.trim() || undefined) : undefined,
        mediaMimetype: messageType === 'image_text' || messageType === 'pdf_text' ? (mediaMimetype.trim() || undefined) : undefined,
        pollOptions: messageType === 'poll' ? cleanOptions : undefined,
        multipleAnswers: messageType === 'poll' ? multipleAnswers : false,
        allowReplies,
        replyPrompt: allowReplies ? replyPrompt.trim() : undefined,
        variables: detectedVariables.map((k) => ({
          key: k,
          description: k.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          sampleValue: sampleValues[k] || '',
        })),
      };

      const url = editId
        ? `/api/vaati/templates/${encodeURIComponent(editId)}`
        : '/api/vaati/templates';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        success('Template Saved', json.message);
        if (andCreateCampaign) {
          navigate(
            `/campaigns/create?gateway=VAATI&templateId=${encodeURIComponent(
              json.data?.id || editId || ''
            )}`
          );
        } else {
          navigate('/vaati/templates');
        }
      } else {
        error('Save Failed', json.message || 'Could not save template.');
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct test send
  const handleSendTestMessage = async () => {
    if (!body.trim()) {
      warning('Empty Body', 'Please enter message content before sending a test.');
      return;
    }
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
          messageType,
          ctaUrl: messageType === 'url_text' ? ctaUrl.trim() : undefined,
          mediaUrl: messageType === 'image_text' || messageType === 'pdf_text' ? mediaUrl.trim() : undefined,
          mediaFilename: messageType === 'image_text' || messageType === 'pdf_text' ? mediaFilename.trim() : undefined,
          mediaMimetype: messageType === 'image_text' || messageType === 'pdf_text' ? mediaMimetype.trim() : undefined,
          pollOptions: messageType === 'poll' ? pollOptions.map((o) => o.trim()).filter(Boolean) : undefined,
          multipleAnswers: messageType === 'poll' ? multipleAnswers : false,
          templateId: editId || undefined,
          allowReplies,
          replyPrompt: allowReplies ? replyPrompt.trim() : undefined,
          body,
          footer,
          variables: detectedVariables,
          values: sampleValues,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTestResult({
          success: true,
          message: json.message,
          providerMessageId: json.providerMessageId,
        });
        success('Test Dispatched', `WhatsApp message sent to ${testPhone} via VAATI!`);
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
      error('Network Error', err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={editId ? 'Edit VAATI Template' : 'Create VAATI WhatsApp Template'}
        description="Compose custom WhatsApp messages with rich text formatting, media attachments, 1-tap polls, and optional user reply collection."
      >
        <button
          onClick={() => navigate('/vaati/templates')}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to VAATI Templates</span>
        </button>
      </PageHeader>

      {/* Main Grid: Form Left, WhatsApp Phone Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Builder Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Form Fields */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Incident Reporting App Announcement"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                >
                  <option value="Hospital Applications">Hospital Applications</option>
                  <option value="Clinical Duty">Clinical Duty</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Staff Notification">Staff Notification</option>
                  <option value="General Utility">General Utility</option>
                </select>
              </div>
            </div>

            {/* Unified 5-Format Payload Picker (Text, URL+Text, Image+Text, PDF+Text, 1-Tap Buttons) */}
            <VaatiFormatEditor
              messageType={messageType}
              onChangeType={(next) => {
                setMessageType(next);
                if (next === 'pdf_text' && !mediaUrl) {
                  setMediaFilename('MAPIMS_Circular.pdf');
                  setMediaMimetype('application/pdf');
                } else if (next === 'image_text' && !mediaUrl) {
                  setMediaFilename('MAPIMS_Poster.jpg');
                  setMediaMimetype('image/jpeg');
                }
              }}
              ctaUrl={ctaUrl}
              onChangeCtaUrl={setCtaUrl}
              mediaUrl={mediaUrl}
              mediaFilename={mediaFilename}
              mediaMimetype={mediaMimetype}
              onChangeMedia={({ url, filename, mimetype }) => {
                setMediaUrl(url);
                if (filename !== undefined) setMediaFilename(filename);
                if (mimetype !== undefined) setMediaMimetype(mimetype);
              }}
              pollOptions={pollOptions}
              onChangePollOptions={setPollOptions}
              multipleAnswers={multipleAnswers}
              onChangeMultipleAnswers={setMultipleAnswers}
            />

            {/* Header (Optional) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Header Text (Optional)</span>
                <span className="text-[10px] text-slate-400 font-normal">Bold headline above message</span>
              </label>
              <input
                type="text"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="e.g. Incident Reporting Application Live"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C76323]"
              />
            </div>

            {/* Message Body + WhatsApp Formatting Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">
                  Message Body Content *
                </label>
                <span className="text-[10px] text-slate-500">
                  WhatsApp Font Styles (select text or click to insert):
                </span>
              </div>

              <WhatsAppFormattingToolbar
                textareaId="templateBodyTextarea"
                value={body}
                onChange={setBody}
              />

              <textarea
                id="templateBodyTextarea"
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Om sakthi,\nOur *Application Name* is now live!\n\n_Tap a formatting button above to apply Bold, Italic, Strike, Mono, Lists, or Quote._`}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#C76323] leading-relaxed resize-y font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Supports WhatsApp formatting (*bold*, _italic_, ~strike~, ```mono```, `code`, lists & quotes) and optional {'{{variable}}'} placeholders.
              </span>
            </div>

            {/* Footer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Footer Text <span className="text-[10px] font-medium italic text-slate-500">(Automatically sent in _italic_ on WhatsApp)</span>
              </label>
              <input
                type="text"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Melmaruvathur Adhiparasakthi Institute of Medical Sciences (MAPIMS)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs italic focus:outline-none focus:ring-2 focus:ring-[#C76323]"
              />
            </div>

            {/* User Replies ON / OFF Toggle */}
            <div
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                allowReplies
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      allowReplies
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                      <span>Allow User Replies to Template Questions</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          allowReplies
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {allowReplies ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {allowReplies
                        ? 'Replies & poll answers sent by staff on WhatsApp will be saved automatically to MongoDB.'
                        : 'One-way notice mode. User replies will not be collected for this template.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={allowReplies}
                  onClick={() => setAllowReplies((prev) => !prev)}
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    allowReplies ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      allowReplies ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {allowReplies && messageType !== 'poll' && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Reply Instruction Prompt <span className="font-normal italic text-emerald-700">(Appended in _italic_ above footer)</span>
                  </label>
                  <input
                    type="text"
                    value={replyPrompt}
                    onChange={(e) => setReplyPrompt(e.target.value)}
                    placeholder="💬 Reply directly to this message to submit your response."
                    className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 italic focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Sample Values for Preview & Test */}
            {detectedVariables.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-900 text-xs block">
                  Sample Values for Phone Preview & Test ({detectedVariables.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {detectedVariables.map((vKey) => (
                    <div key={vKey}>
                      <span className="text-[10px] font-mono font-bold text-slate-600 block mb-0.5">
                        {'{{' + vKey + '}}'}
                      </span>
                      <input
                        type="text"
                        value={sampleValues[vKey] || ''}
                        onChange={(e) =>
                          setSampleValues((prev) => ({ ...prev, [vKey]: e.target.value }))
                        }
                        placeholder={`Value for {{${vKey}}}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Phone & Test Button */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C76323]" />
                  <span>Verify on Real WhatsApp Handset</span>
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  ⚡ VAATI Direct
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+91 95513 82296"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                />
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleSendTestMessage}
                  className="px-4 py-2 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-60"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Now</span>
                    </>
                  )}
                </button>
              </div>

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
                        ID: {testResult.providerMessageId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/vaati/templates')}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveTemplate(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveTemplate(true)}
                  className="px-5 py-2.5 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Create Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Mobile Phone Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col items-center">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live WhatsApp Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ⚡ VAATI Self-Hosted
              </span>
            </div>

            {/* Smartphone Shell */}
            <div className="w-full max-w-[340px] rounded-[36px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700/60 ring-1 ring-slate-800">
              <div className="w-full bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[560px] relative shadow-inner">
                {/* Header */}
                <div className="bg-[#1E3A8A] text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden ring-2 ring-white/30 shrink-0">
                    <img src="/mapims-logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">MAPIMS Hospitals</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-200 opacity-90 truncate">
                      VAATI Verified Broadcast
                    </p>
                  </div>
                </div>

                {/* Chat Message Scroll */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  <div className="text-center my-1">
                    <span className="bg-white/80 text-[10px] font-semibold text-slate-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                      TODAY
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm max-w-[95%] border border-slate-200/40 space-y-2 text-xs">
                    {header && (
                      <div className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                        {header}
                      </div>
                    )}
                    <VaatiPreviewAttachment
                      messageType={messageType}
                      ctaUrl={ctaUrl}
                      mediaUrl={mediaUrl}
                      mediaFilename={mediaFilename}
                      pollOptions={pollOptions}
                      multipleAnswers={multipleAnswers}
                    />
                    <div className="text-slate-800 leading-relaxed font-sans">
                      <WhatsAppFormattedText
                        text={renderedPreviewText || 'Your template message will appear here...'}
                      />
                    </div>
                    {allowReplies && messageType !== 'poll' && replyPrompt.trim() && (
                      <div className="text-[10px] text-emerald-700 font-medium italic pt-1 border-t border-emerald-100">
                        {replyPrompt}
                      </div>
                    )}
                    {messageType !== 'poll' && footer && (
                      <div className="text-[10px] text-slate-400 font-medium italic pt-1 border-t border-slate-100">
                        {footer}
                      </div>
                    )}
                    <div className="text-right text-[9px] text-slate-400 font-mono flex items-center justify-end gap-1">
                      <span>13:45</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Input Simulation */}
                <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
                  <div
                    className={`flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] border truncate ${
                      allowReplies
                        ? 'text-emerald-700 border-emerald-300 font-medium'
                        : 'text-slate-400 border-slate-200'
                    }`}
                  >
                    {allowReplies ? '💬 Replies ON — User can reply...' : '🔒 Replies OFF (One-way notice)'}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs ${
                      allowReplies ? 'bg-emerald-600' : 'bg-[#1E3A8A]'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateVaatiTemplatePage;
