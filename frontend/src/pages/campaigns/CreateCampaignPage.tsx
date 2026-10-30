import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Users,
  FileText,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Info,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { WhatsAppPhonePreview } from '../../components/common/WhatsAppPhonePreview';
import { mockCategories, mockDepartments, mockEmployees, mockTemplates } from '../../data/mockData';
import { WhatsAppTemplate, Employee } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');

  // Step 2: Recipients (Cascading filtering)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    mockEmployees.map((e) => e.id)
  );

  // Step 3: Template & Variables
  // Only Approved templates can be used in campaigns!
  const approvedTemplates = mockTemplates.filter((t) => t.status === 'APPROVED');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    approvedTemplates[0]?.id || ''
  );
  const activeTemplate =
    approvedTemplates.find((t) => t.id === selectedTemplateId) || approvedTemplates[0];

  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    '1': '{{employee.name}}',
    '2': 'Emergency Department',
    '3': '31 Oct 2026',
    '4': 'Night Shift (08:00 PM - 08:00 AM)',
    '5': 'ER Nursing Station 1',
    '6': 'Ext 104 / 27568100',
  });

  // Step 4: Preview Recipient
  const [previewStaffId, setPreviewStaffId] = useState<string>(mockEmployees[0].id);

  // Step 5: Dispatch Schedule
  const [dispatchTiming, setDispatchTiming] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduleDateTime, setScheduleDateTime] = useState('2026-10-31T09:00');

  // Calculate live recipient breakdown
  const matchingEmployees = mockEmployees.filter((emp) => {
    const matchCat = selectedCategory === 'ALL' || emp.category === selectedCategory;
    const matchDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
    return matchCat && matchDept;
  });

  const selectedCount = matchingEmployees.filter((e) => selectedStaffIds.includes(e.id)).length;
  const optedOutCount = matchingEmployees.filter(
    (e) => selectedStaffIds.includes(e.id) && e.consentStatus === 'Opted-Out'
  ).length;
  const invalidCount = matchingEmployees.filter(
    (e) => selectedStaffIds.includes(e.id) && e.whatsappNumber.length < 10
  ).length;
  const duplicateCount = 0;
  const eligibleCount = Math.max(0, selectedCount - optedOutCount - invalidCount);

  const sampleStaff = mockEmployees.find((e) => e.id === previewStaffId) || mockEmployees[0];

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        error('Title Required', 'Please provide a campaign title.');
        return;
      }
    }
    if (step === 2) {
      if (eligibleCount === 0) {
        warning('No Eligible Recipients', 'Selected audience has 0 eligible consented staff.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5) as WizardStep);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  const handleSaveDraft = () => {
    success('Draft Persisted', `Campaign "${title || 'Untitled Campaign'}" saved to drafts.`);
    navigate('/campaigns/drafts');
  };

  const handleSubmitForApproval = () => {
    success(
      'Campaign Submitted for Four-Eyes Review',
      `Campaign "${title}" submitted. Separation of duties requires approval from an authorized approver before sending.`
    );
    navigate('/campaigns/approvals');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create WhatsApp Campaign"
        description="Target hospital employees by category & department, select Meta-approved WATI templates, and queue for clinical review."
      >
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-slate-500" />
          <span>Save Draft</span>
        </button>
      </PageHeader>

      {/* 5-Step Stepper Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {[
            { stepNum: 1, title: 'Details' },
            { stepNum: 2, title: 'Recipients' },
            { stepNum: 3, title: 'Template' },
            { stepNum: 4, title: 'Preview' },
            { stepNum: 5, title: 'Review & Submit' },
          ].map((s, idx) => (
            <React.Fragment key={s.stepNum}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s.stepNum
                      ? 'bg-[#243B67] text-white ring-4 ring-[#243B67]/20'
                      : step > s.stepNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {step > s.stepNum ? '✓' : s.stepNum}
                </div>
                <span
                  className={`text-xs font-semibold hidden md:inline ${
                    step === s.stepNum ? 'text-[#243B67]' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < 4 && <div className="flex-1 h-0.5 mx-2 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Grid: Wizard Form (Left 8 cols) & Persistent Recipient Summary Sidebar (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Container */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campaign Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define title, operational urgency, and broadcast purpose.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Night Shift Roster Announcement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Purpose & Internal Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this announcement is being sent to hospital staff..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                  >
                    <option value="Normal">Normal (General Notice / CME / Circular)</option>
                    <option value="Urgent">Urgent (Shift Change / Roster Alert)</option>
                    <option value="Emergency">Emergency (Disaster Protocol / Code Blue Recall)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Campaign Author / Creator
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (${currentUser.role})`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bound to current user ID. Cannot self-approve per hospital security policy.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Recipients */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Target Staff</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filters cascade automatically. Non-consented staff are automatically excluded.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employee Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedDepartment('ALL'); // Reset dependent child filter
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                  >
                    <option value="ALL">All Categories</option>
                    {mockCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.employeeCount} staff)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                  >
                    <option value="ALL">All Departments in Category</option>
                    {mockDepartments
                      .filter(
                        (d) =>
                          selectedCategory === 'ALL' || d.categoryName === selectedCategory
                      )
                      .map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Matching Staff List with Checkboxes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-700 font-semibold">
                  <span>Filtered Staff Directory ({matchingEmployees.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStaffIds.length === matchingEmployees.length) {
                        setSelectedStaffIds([]);
                      } else {
                        setSelectedStaffIds(matchingEmployees.map((e) => e.id));
                      }
                    }}
                    className="text-xs text-[#243B67] hover:underline"
                  >
                    {selectedStaffIds.length === matchingEmployees.length
                      ? 'Deselect All'
                      : 'Select All Filtered'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {matchingEmployees.map((emp) => {
                    const isSelected = selectedStaffIds.includes(emp.id);
                    const isBlocked = emp.consentStatus === 'Opted-Out';
                    return (
                      <label
                        key={emp.id}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          isBlocked ? 'bg-rose-50/30 opacity-70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedStaffIds((prev) =>
                                prev.includes(emp.id)
                                  ? prev.filter((id) => id !== emp.id)
                                  : [...prev, emp.id]
                              );
                            }}
                            className="rounded border-slate-300 text-[#243B67] focus:ring-[#243B67]"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {emp.employeeId} • {emp.designation} • {emp.department}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              emp.consentStatus === 'Opted-In'
                                ? 'bg-emerald-50 text-emerald-700'
                                : emp.consentStatus === 'Opted-Out'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {emp.consentStatus}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Template & Variables */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Approved Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only Meta-approved WATI templates can be dispatched to staff phones.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approved WhatsApp Template *
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                >
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (WATI ID: {t.watiTemplateId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Body Snippet Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Approved Body Format
                </span>
                <p className="text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {activeTemplate.body}
                </p>
              </div>

              {/* Dynamic Variable Mappings */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Map Dynamic Message Variables</h4>
                  <span className="text-slate-400 text-[11px]">
                    Use <code>{'{{employee.name}}'}</code> for automated personalization
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTemplate.variables.map((v) => (
                    <div
                      key={v.key}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 items-center"
                    >
                      <div className="font-semibold text-slate-800">
                        {`{{${v.key}}}`}: {v.description}
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={variableValues[v.key] || v.sampleValue}
                          onChange={(e) =>
                            setVariableValues((prev) => ({ ...prev, [v.key]: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personalized Message Preview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify how this broadcast renders on a staff member's WhatsApp chat.
                  </p>
                </div>

                {/* Recipient switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Recipient:</span>
                  <select
                    value={previewStaffId}
                    onChange={(e) => setPreviewStaffId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {matchingEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-100/60 rounded-2xl flex justify-center border border-slate-200">
                <WhatsAppPhonePreview
                  template={activeTemplate}
                  variables={variableValues}
                  sampleRecipientName={sampleStaff.name}
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Campaign Review & Scheduling</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm recipient snapshot and dispatch schedule before submitting for clinical approval.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-medium block">Campaign Title</span>
                    <strong className="text-slate-900">{title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Priority</span>
                    <strong className="text-[#7B2846]">{priority}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Selected Template</span>
                    <strong className="text-slate-900 font-mono">{activeTemplate.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Author / Creator</span>
                    <strong className="text-slate-900">{currentUser.name}</strong>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">Dispatch Timing</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="dispatch"
                      checked={dispatchTiming === 'NOW'}
                      onChange={() => setDispatchTiming('NOW')}
                      className="text-[#243B67] focus:ring-[#243B67]"
                    />
                    <span>Immediate Dispatch (Upon Approval)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="dispatch"
                      checked={dispatchTiming === 'SCHEDULE'}
                      onChange={() => setDispatchTiming('SCHEDULE')}
                      className="text-[#243B67] focus:ring-[#243B67]"
                    />
                    <span>Schedule for Future Date/Time</span>
                  </label>
                </div>

                {dispatchTiming === 'SCHEDULE' && (
                  <div className="pt-2 max-w-xs">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Target Timezone: Asia/Kolkata (IST)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Separation of duties security note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Separation of Duties Notice:</strong> In compliance with hospital enterprise governance, campaigns cannot be self-approved. Once submitted, this broadcast will enter the Campaign Approval Queue for review by an authorized clinical approver.
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                className="px-6 py-2.5 bg-[#7B2846] hover:bg-[#621f37] text-white rounded-lg font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for Clinical Approval</span>
              </button>
            )}
          </div>
        </div>

        {/* Persistent Recipient Snapshot Summary Sidebar (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm">Recipient Snapshot</h4>
            <span className="text-[10px] text-slate-400">Live Breakdown</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Matching Filter Criteria</span>
              <span className="font-bold text-slate-800">{matchingEmployees.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Selected Staff</span>
              <span className="font-bold text-slate-800">{selectedCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Opted-Out (Suppressed)
              </span>
              <span className="font-bold">-{optedOutCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-amber-600">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Invalid / Incomplete
              </span>
              <span className="font-bold">-{invalidCount}</span>
            </div>
          </div>

          {/* Final Eligible Callout */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Net Eligible Broadcasts
            </span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
              {eligibleCount}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">
              Verified WhatsApp numbers with confirmed consent
            </span>
          </div>

          {/* Template Details Summary in Sidebar */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div>
              <strong>Template:</strong> {activeTemplate.name}
            </div>
            <div>
              <strong>Category Scope:</strong> {selectedCategory}
            </div>
            <div>
              <strong>Department Scope:</strong> {selectedDepartment}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
