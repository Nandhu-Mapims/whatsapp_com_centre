import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Save,
  Send,
  Trash2,
  Plus,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockEmployees } from '../../data/mockData';
import { WhatsAppTemplate, HeaderType, TemplateButton, TemplateVariable } from '../../types';
import { useToast } from '../../context/ToastContext';

export const TemplateDesignerPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, warning, error } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected sample recipient for preview
  const [sampleRecipientId, setSampleRecipientId] = useState(mockEmployees[0].id);

  // Form Fields for Draft Template (Prefixed with aph_ for APH Connect)
  const [templateName, setTemplateName] = useState('aph_clinical_advisory_v1');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
  const [language, setLanguage] = useState('en');
  const [headerType, setHeaderType] = useState<HeaderType>('TEXT');
  const [headerContent, setHeaderContent] = useState('🏥 MAPIMS HOSPITAL ADVISORY');
  const [bodyText, setBodyText] = useState(
    'Dear {{1}},\n\nPlease be informed that {{2}} will take place on {{3}} at {{4}}.\n\nAll concerned department staff are requested to ensure timely attendance.\n\nReporting Officer: {{5}}.'
  );
  const [footerText, setFooterText] = useState('Medical Director Office — MAPIMS');
  const [buttons, setButtons] = useState<TemplateButton[]>([
    { type: 'QUICK_REPLY', text: 'Acknowledge Notice' },
    { type: 'PHONE_NUMBER', text: 'Call Hospital Control', value: '+914427568100' },
  ]);

  // Variables mapping with sample values
  const [variables, setVariables] = useState<Record<string, string>>({
    '1': '{{employee.name}}',
    '2': 'Annual Bio-Medical Safety Inspection',
    '3': '05 Nov 2026',
    '4': 'Ground Floor Seminar Hall',
    '5': 'Hospital Administration',
  });

  const selectedSampleEmployee =
    mockEmployees.find((e) => e.id === sampleRecipientId) || mockEmployees[0];

  // Helper to add variable placeholder into body
  const handleInsertVariable = (varIndex: number) => {
    setBodyText((prev) => `${prev} {{${varIndex}}}`);
    if (!variables[String(varIndex)]) {
      setVariables((prev) => ({
        ...prev,
        [String(varIndex)]: `Sample Value ${varIndex}`,
      }));
    }
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) {
      warning('Limit Reached', 'WhatsApp allows maximum 3 quick reply buttons.');
      return;
    }
    setButtons((prev) => [
      ...prev,
      { type: 'QUICK_REPLY', text: `Option ${prev.length + 1}` },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    success('Draft Saved', `Draft template "${templateName}" saved locally.`);
  };

  const handleLoadTestTemplate = () => {
    setTemplateName('aph_system_test_alert_v1');
    setCategory('UTILITY');
    setLanguage('en');
    setHeaderType('TEXT');
    setHeaderContent('🧪 APH CONNECT SYSTEM TEST');
    setBodyText(
      'Hello {{1}},\n\nThis is an official test notification from APH Connect Employee Communication Platform at MAPIMS / Adhiparasakthi Hospitals.\n\nTest Timestamp: {{2}}\nPlatform Status: Operational\n\nPlease acknowledge receipt by tapping the button below.'
    );
    setFooterText('APH Connect • System Health Test');
    setButtons([
      { type: 'QUICK_REPLY', text: 'Confirm Test Receipt' },
    ]);
    setVariables({
      '1': selectedSampleEmployee?.name || 'Dr. A. Saravanan',
      '2': new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    success('Test Template Loaded', 'Pre-filled with guaranteed-to-pass test parameters.');
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          category,
          language,
          headerType,
          headerContent,
          body: bodyText,
          footer: footerText,
          buttons,
          variables,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success(
          'Submitted to WATI',
          data.message || `Template "${templateName}" registered in WATI and submitted for Meta approval.`
        );
        navigate('/templates');
      } else {
        error('Submission Failed', data.message || 'Could not register template in WATI.');
      }
    } catch (err: any) {
      error('Submission Error', err.message || 'Network error while contacting server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compile full template object for WhatsAppPhonePreview
  const previewTemplateObj: WhatsAppTemplate = {
    id: 'preview-tmpl',
    name: templateName,
    category,
    language,
    headerType,
    headerContent,
    body: bodyText,
    footer: footerText,
    buttons,
    variables: Object.keys(variables).map((k) => ({
      key: k,
      sampleValue: variables[k],
      description: `Variable {{${k}}}`,
    })),
    status: 'DRAFT',
    createdAt: '2026-10-30',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Template Designer"
        description="Author Meta-compliant WhatsApp templates or configure dynamic parameters for approved hospital circulars."
      >
        <button
          onClick={handleLoadTestTemplate}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 rounded-lg shadow-2xs transition-colors"
          title="Click to load a pre-configured, Meta-compliant test template"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load Test Template</span>
        </button>
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-slate-500" />
          <span>Save Draft</span>
        </button>
        <button
          onClick={handleSubmitForApproval}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Submit for Approval</span>
        </button>
      </PageHeader>

      {/* Sample Employee Switcher for Preview */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Template Authoring & WATI Submission
          </span>
          <span className="text-[10px] bg-[#1E3A8A]/10 text-[#1E3A8A] font-semibold px-2 py-0.5 rounded">
            Meta Compliance Ready
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" /> Preview Recipient:
          </span>
          <select
            value={sampleRecipientId}
            onChange={(e) => setSampleRecipientId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            {mockEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Layout: Editor (Left) & Sticky WhatsApp Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Forms */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
          <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Template Identifier (WATI Unique Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Use lowercase letters, numbers, and underscores only.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="UTILITY">Utility (Shift & Duty Circulars)</option>
                    <option value="MARKETING">Marketing (Outreach & Events)</option>
                    <option value="AUTHENTICATION">Authentication (OTP)</option>
                  </select>
                </div>
              </div>

              {/* Header Type */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">Header Component</label>
                  <select
                    value={headerType}
                    onChange={(e) => setHeaderType(e.target.value as HeaderType)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700"
                  >
                    <option value="NONE">None</option>
                    <option value="TEXT">Text Header</option>
                    <option value="IMAGE">Image Header</option>
                    <option value="DOCUMENT">Document (PDF)</option>
                    <option value="VIDEO">Video Header</option>
                  </select>
                </div>

                {headerType === 'TEXT' && (
                  <input
                    type="text"
                    placeholder="Enter header headline (e.g. 🏥 MAPIMS HOSPITAL ADVISORY)"
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                )}
                {headerType === 'IMAGE' && (
                  <input
                    type="text"
                    placeholder="Sample image URL (e.g. https://.../banner.jpg)"
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                  />
                )}
                {headerType === 'DOCUMENT' && (
                  <input
                    type="text"
                    placeholder="Sample PDF document URL (e.g. https://.../roster.pdf)"
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                  />
                )}
              </div>

              {/* Body Text Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Template Body Content *
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 mr-1">Insert Variable:</span>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleInsertVariable(num)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-[#1E3A8A] hover:text-white rounded text-[11px] font-mono font-bold text-slate-700 transition-colors"
                      >
                        {`{{${num}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Footer (Optional Disclaimer or Signature)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical Director Office — MAPIMS"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              {/* Interactive Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Interactive WhatsApp Buttons ({buttons.length}/3)
                  </label>
                  {buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddButton}
                      className="text-[#1E3A8A] font-semibold flex items-center gap-1 hover:underline text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Button
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                    >
                      <select
                        value={btn.type}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[idx].type = e.target.value as any;
                          setButtons(updated);
                        }}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="PHONE_NUMBER">Call Hospital</option>
                        <option value="URL">Open Link</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Button text"
                        value={btn.text}
                        onChange={(e) => {
                          const updated = [...buttons];
                          updated[idx].text = e.target.value;
                          setButtons(updated);
                        }}
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                      />

                      {btn.type !== 'QUICK_REPLY' && (
                        <input
                          type="text"
                          placeholder={btn.type === 'PHONE_NUMBER' ? '+91...' : 'https://...'}
                          value={btn.value || ''}
                          onChange={(e) => {
                            const updated = [...buttons];
                            updated[idx].value = e.target.value;
                            setButtons(updated);
                          }}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Variable Values */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Sample Variable Values for Preview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(variables).map((key) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-mono font-bold text-[#1E3A8A] shrink-0">{`{{${key}}}`}:</span>
                      <input
                        type="text"
                        value={variables[key]}
                        onChange={(e) =>
                          setVariables((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* Right Column: Sticky WhatsApp Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 flex justify-center">
          <WhatsAppPhonePreview
            template={previewTemplateObj}
            variables={variables}
            sampleRecipientName={selectedSampleEmployee.name}
          />
        </div>
      </div>
    </div>
  );
};
