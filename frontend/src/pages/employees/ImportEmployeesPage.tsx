import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

type ImportStep = 1 | 2 | 3 | 4 | 5;

interface ImportedRow {
  rowNum: number;
  empId: string;
  name: string;
  whatsapp: string;
  category: string;
  department: string;
  designation: string;
  consentRef: string;
  status: 'VALID' | 'WARNING' | 'REJECTED';
  issue?: string;
}

export const ImportEmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [currentStep, setCurrentStep] = useState<ImportStep>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicateOption, setDuplicateOption] = useState<'skip' | 'update'>('skip');
  const [previewTab, setPreviewTab] = useState<'ALL' | 'VALID' | 'WARNINGS' | 'REJECTED'>('ALL');

  // Simulated Parsed & Validated Data
  const sampleRows: ImportedRow[] = [
    {
      rowNum: 1,
      empId: 'MAP-1092',
      name: 'Dr. Suresh Kumar',
      whatsapp: '+919840911223',
      category: 'Medical / Clinical',
      department: 'Emergency & Trauma Care',
      designation: 'Duty Medical Officer',
      consentRef: 'HR Portal Consent Form 2026',
      status: 'VALID',
    },
    {
      rowNum: 2,
      empId: 'MAP-2104',
      name: 'Staff Nurse Gomathi',
      whatsapp: '+919789123456',
      category: 'Nursing Staff',
      department: 'Intensive Care Unit (ICU & CCU)',
      designation: 'Staff Nurse',
      consentRef: 'Induction Signed E-Copy',
      status: 'VALID',
    },
    {
      rowNum: 3,
      empId: 'MAP-1021',
      name: 'Dr. A. Saravanan (Existing)',
      whatsapp: '+919840123456',
      category: 'Medical / Clinical',
      department: 'Emergency & Trauma Care',
      designation: 'Senior Consultant - ER',
      consentRef: 'Existing Consent Retained',
      status: 'WARNING',
      issue: 'Duplicate Employee ID in master database. Will follow selected overwrite option.',
    },
    {
      rowNum: 4,
      empId: 'MAP-5044',
      name: 'K. Murugesan',
      whatsapp: '984099',
      category: 'Housekeeping & Maintenance',
      department: 'Hospital Infection Control & Sanitation',
      designation: 'Sanitation Attendant',
      consentRef: 'Missing',
      status: 'REJECTED',
      issue: 'Invalid WhatsApp format. Must be at least 10 digits with valid country prefix.',
    },
    {
      rowNum: 5,
      empId: 'MAP-3090',
      name: 'V. Jayanthi',
      whatsapp: '+919444789012',
      category: 'Allied Health Sciences',
      department: 'Radiology & Imaging',
      designation: 'X-Ray Tech',
      consentRef: 'Signed Acknowledgement',
      status: 'VALID',
    },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,employee_id,name,whatsapp_number,category,department,designation,consent_reference\nMAP-1099,Dr. Sample Doctor,+919840001122,Medical / Clinical,Emergency & Trauma Care,Consultant,HR Induction 2026\nMAP-2200,Sister Sample Nurse,+919840003344,Nursing Staff,General Inpatient Wards (Nursing),Staff Nurse,HR Induction 2026';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MAPIMS_Staff_Import_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Sample Downloaded', 'Use this format to prepare your staff spreadsheet.');
  };

  const filteredPreviewRows = sampleRows.filter((r) => {
    if (previewTab === 'VALID') return r.status === 'VALID';
    if (previewTab === 'WARNINGS') return r.status === 'WARNING';
    if (previewTab === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  const validCount = sampleRows.filter((r) => r.status === 'VALID').length;
  const warningCount = sampleRows.filter((r) => r.status === 'WARNING').length;
  const rejectedCount = sampleRows.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Employees from Excel / CSV"
        description="Safely bulk-register hospital staff with pre-validation, phone normalization, and consent reference mapping."
      >
        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download Sample Template</span>
        </button>
      </PageHeader>

      {/* Stepper Wizard Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {[
            { step: 1, label: 'Upload' },
            { step: 2, label: 'Map Columns' },
            { step: 3, label: 'Validate' },
            { step: 4, label: 'Review' },
            { step: 5, label: 'Results' },
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep === s.step
                      ? 'bg-[#1E3A8A] text-white ring-4 ring-[#1E3A8A]/20'
                      : currentStep > s.step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {currentStep > s.step ? '✓' : s.step}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    currentStep === s.step ? 'text-[#1E3A8A]' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 4 && <div className="flex-1 h-0.5 mx-2 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: Upload */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-900">Upload Hospital Staff Roster</h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv files up to 15MB.
            </p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-300 hover:border-[#1E3A8A] rounded-2xl p-8 text-center bg-slate-50/60 transition-colors cursor-pointer"
          >
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl text-[#1E3A8A] shadow-xs mb-3 border border-slate-200">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Drag & drop staff file here, or browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB ready for mapping`
                  : 'Requires columns: Employee ID, Name, WhatsApp Number, Category, Department'}
              </p>
            </label>
          </div>

          {/* Import Duplicate Policy Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <label className="font-bold text-slate-800 block">
              Duplicate Employee ID Resolution:
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateOption === 'skip'}
                  onChange={() => setDuplicateOption('skip')}
                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span className="text-slate-700">
                  <strong>Skip existing employees</strong> (Retain current contact and consent)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateOption === 'update'}
                  onChange={() => setDuplicateOption('update')}
                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span className="text-slate-700">
                  <strong>Update profile details</strong> (Never silently overwrite opt-out consent)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              <span>Continue to Column Mapping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Map Columns */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Map File Columns</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify your spreadsheet header matches the required hospital master schema.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { field: 'Employee ID *', auto: 'employee_id', sample: 'MAP-1092' },
              { field: 'Full Name *', auto: 'name', sample: 'Dr. Suresh Kumar' },
              { field: 'WhatsApp Number *', auto: 'whatsapp_number', sample: '+91 98409 11223' },
              { field: 'Category *', auto: 'category', sample: 'Medical / Clinical' },
              { field: 'Department *', auto: 'department', sample: 'Emergency & Trauma Care' },
              { field: 'Designation', auto: 'designation', sample: 'Duty Medical Officer' },
              { field: 'Consent Reference / Proof', auto: 'consent_reference', sample: 'HR Portal Consent Form 2026' },
            ].map((col) => (
              <div
                key={col.field}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80 items-center"
              >
                <div className="font-semibold text-slate-800">{col.field}</div>
                <div>
                  <select
                    defaultValue={col.auto}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value={col.auto}>Matched: {col.auto}</option>
                    <option value="none">-- Unmapped --</option>
                  </select>
                </div>
                <div className="text-[11px] text-slate-500 italic truncate">
                  Preview: {col.sample}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <span>Validate Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Validate & Review */}
      {(currentStep === 3 || currentStep === 4) && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentStep === 3 ? 'Validation Results' : 'Final Import Review'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect validity, warnings, and rejected records before saving to hospital database.
              </p>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPreviewTab('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  previewTab === 'ALL' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'
                }`}
              >
                All ({sampleRows.length})
              </button>
              <button
                onClick={() => setPreviewTab('VALID')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  previewTab === 'VALID' ? 'bg-white shadow-2xs font-bold text-emerald-700' : 'text-slate-600'
                }`}
              >
                Valid ({validCount})
              </button>
              <button
                onClick={() => setPreviewTab('WARNINGS')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  previewTab === 'WARNINGS' ? 'bg-white shadow-2xs font-bold text-amber-700' : 'text-slate-600'
                }`}
              >
                Warnings ({warningCount})
              </button>
              <button
                onClick={() => setPreviewTab('REJECTED')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  previewTab === 'REJECTED' ? 'bg-white shadow-2xs font-bold text-rose-700' : 'text-slate-600'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Validation Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-900">{validCount} Ready to Insert</div>
                <div className="text-[11px] text-emerald-700">Passed schema & WhatsApp format checks</div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-900">{warningCount} Overwrite Warnings</div>
                <div className="text-[11px] text-amber-700">Existing ID detected in master</div>
              </div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-rose-900">{rejectedCount} Rejected Rows</div>
                <div className="text-[11px] text-rose-700">Invalid phone / missing mandatory fields</div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Validation Status</th>
                    <th className="py-2.5 px-3">Diagnostic Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPreviewRows.map((r) => (
                    <tr key={r.rowNum} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono text-slate-400">#{r.rowNum}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{r.empId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-2.5 px-3 font-mono">{r.whatsapp}</td>
                      <td className="py-2.5 px-3">{r.department}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {r.issue || 'Clean record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => {
                success('Import Confirmed', 'Processing batch into hospital directory.');
                setCurrentStep(5);
              }}
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <span>Confirm & Commit Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Results */}
      {currentStep === 5 && (
        <div className="bg-white rounded-xl p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FileCheck className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Import Completed Successfully</h3>
            <p className="text-xs text-slate-500 mt-1">
              Batch Job Reference: <span className="font-mono font-bold text-slate-800">IMP-JOB-9822</span>
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Inserted</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">3</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Updated</div>
              <div className="text-lg font-bold text-blue-600 mt-0.5">1</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Skipped</div>
              <div className="text-lg font-bold text-slate-600 mt-0.5">0</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Rejected</div>
              <div className="text-lg font-bold text-rose-600 mt-0.5">1</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedFile(null);
                setCurrentStep(1);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Import Another File
            </button>
            <button
              onClick={() => navigate('/employees')}
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              View Employee List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
