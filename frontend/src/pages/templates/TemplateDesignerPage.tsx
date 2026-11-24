import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  FileEdit,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockEmployees } from '../../data/mockData';
import { WhatsAppTemplate, HeaderType, TemplateButton, TemplateVariable } from '../../types';
import { useToast } from '../../context/ToastContext';

export const TemplateDesignerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { success, warning, error } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

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

  // Populate form with existing template
  const loadTemplateIntoForm = (t: WhatsAppTemplate) => {
    setEditingTemplateId(t.id || t.name);
    setIsEditingExisting(true);
    setTemplateName(t.name);
    setCategory((t.category as any) || 'UTILITY');
    setLanguage(t.language || 'en');
    setHeaderType(t.headerType || 'NONE');
    setHeaderContent(t.headerContent || '');
    setBodyText(t.body || '');
    setFooterText(t.footer || '');
    setButtons(t.buttons ? t.buttons.map((b) => ({ ...b })) : []);

    const newVars: Record<string, string> = {};
    if (t.variables && Array.isArray(t.variables)) {
      t.variables.forEach((v) => {
        newVars[String(v.key)] = v.sampleValue || '';
      });
    }

    const bodyMatches = (t.body || '').match(/\{\{([0-9a-zA-Z_]+)\}\}/g) || [];
    bodyMatches.forEach((m) => {
      const k = m.replace(/[{}]/g, '');
      if (!newVars[k]) {
        if (k === '1') newVars[k] = '{{employee.name}}';
        else newVars[k] = `Sample ${k}`;
      }
    });

    setVariables(newVars);
  };

  // Detect incoming template from navigation state, query params, or cache
  useEffect(() => {
    // 1. Direct navigation state from "Edit Draft" button
    if (location.state?.template) {
      loadTemplateIntoForm(location.state.template);
      return;
    }

    // 2. Query param ?id=... (browser refresh or deep link)
    if (editId) {
      try {
        const cached = sessionStorage.getItem('editing_template');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.id === editId || parsed.name === editId || parsed.watiTemplateId === editId) {
            loadTemplateIntoForm(parsed);
            return;
          }
        }
      } catch (err) {
        console.warn('Error reading editing_template from sessionStorage:', err);
      }

      // Fetch from API if not in session cache
      fetch('/api/templates')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            const found = json.data.find(
              (t: WhatsAppTemplate) =>
                t.id === editId || t.name === editId || t.watiTemplateId === editId
            );
            if (found) {
              loadTemplateIntoForm(found);
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch templates for edit ID:', err));
      return;
    }

    // 3. Brand new template authoring: clean up any stale editing session
    try {
      sessionStorage.removeItem('editing_template');
    } catch {}
    setIsEditingExisting(false);
    setEditingTemplateId(null);
  }, [location.state, editId]);

  // Reset editor to author a fresh template
  const handleStartFresh = () => {
    try {
      sessionStorage.removeItem('editing_template');
    } catch {}
    setEditingTemplateId(null);
    setIsEditingExisting(false);
    setTemplateName('aph_clinical_advisory_v1');
    setCategory('UTILITY');
    setLanguage('en');
    setHeaderType('TEXT');
    setHeaderContent('🏥 MAPIMS HOSPITAL ADVISORY');
    setBodyText(
      'Dear {{1}},\n\nPlease be informed that {{2}} will take place on {{3}} at {{4}}.\n\nAll concerned department staff are requested to ensure timely attendance.\n\nReporting Officer: {{5}}.'
    );
    setFooterText('Medical Director Office — MAPIMS');
    setButtons([
      { type: 'QUICK_REPLY', text: 'Acknowledge Notice' },
      { type: 'PHONE_NUMBER', text: 'Call Hospital Control', value: '+914427568100' },
    ]);
    setVariables({
      '1': '{{employee.name}}',
      '2': 'Annual Bio-Medical Safety Inspection',
      '3': '05 Nov 2026',
      '4': 'Ground Floor Seminar Hall',
      '5': 'Hospital Administration',
    });
    navigate('/templates/designer', { replace: true });
    success('Fresh Canvas', 'Reset to new blank template authoring.');
  };

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

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplateId,
          name: templateName,
          category,
          language,
          headerType,
          headerContent,
          body: bodyText,
          footer: footerText,
          buttons,
          variables,
          isDraft: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.id) {
          setEditingTemplateId(data.data.id);
          setIsEditingExisting(true);
          try {
            sessionStorage.setItem('editing_template', JSON.stringify(data.data));
          } catch {}
        }
        success('Draft Saved', `Draft template "${templateName}" saved locally.`);
      } else {
        error('Save Failed', data.message || 'Could not save draft.');
      }
    } catch (err: any) {
      error('Save Error', err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleLoadIncidentUtilityTemplate = () => {
    setTemplateName('aph_incident_duty_alert');
    setCategory('UTILITY');
    setLanguage('en');
    setHeaderType('NONE');
    setHeaderContent('');
    setBodyText(
      'Om Sakthi,\nHospital Operational Circular:\nMandatory Incident Reporting Portal access for staff member {{1}}.\n\nOfficial Portal Access:\n🔗 {{2}}\n\nStaff Login Credentials:\n👤 Username: Your Employee ID\n🔑 Password: {{3}}\n\nDepartment Administration, MAPIMS Hospitals.'
    );
    setFooterText('Adhiparasakthi Hospitals');
    setButtons([]);
    setVariables({
      '1': selectedSampleEmployee?.name || 'Dr. A. Saravanan',
      '2': 'https://inc.mapims.edu.in/login',
      '3': 'mapims@123',
    });
    success('Incident Utility Template Loaded', 'Pre-configured with Meta-compliant Utility wording.');
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplateId,
          name: templateName,
          category,
          language,
          headerType,
          headerContent,
          body: bodyText,
          footer: footerText,
          buttons,
          variables,
          isDraft: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          sessionStorage.removeItem('editing_template');
        } catch {}
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
    id: editingTemplateId || 'preview-tmpl',
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
    createdAt: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Template Designer"
        description="Author Meta-compliant WhatsApp templates or configure dynamic parameters for approved hospital circulars."
      >
        <button
          onClick={handleLoadIncidentUtilityTemplate}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-900 rounded-lg shadow-2xs transition-colors"
          title="Click to load pre-configured Incident Portal Utility template for Meta approval"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Load Incident Utility Template</span>
        </button>
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
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-slate-500" />
          <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
        </button>
        <button
          onClick={handleSubmitForApproval}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</span>
        </button>
      </PageHeader>

      {/* Editing Existing Draft Banner */}
      {isEditingExisting && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3 text-amber-950">
            <div className="w-9 h-9 rounded-xl bg-amber-200/70 flex items-center justify-center shrink-0 text-amber-800">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Editing Existing Draft / Template:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-900">
                  {templateName}
                </span>
                {editingTemplateId && (
                  <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                    (ID: {editingTemplateId})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Modifications will update this specific template. Click "Save Draft" to update locally or "Submit for Approval" to register in WATI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartFresh}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            <span>+ Start Fresh / Create New</span>
          </button>
        </div>
      )}

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
