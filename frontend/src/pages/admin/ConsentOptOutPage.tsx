import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Phone,
  FileCheck,
  Plus,
  X,
  Download,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockEmployees } from '../../data/mockData';
import { Employee } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ConsentOptOutPage: React.FC = () => {
  const { success, warning } = useToast();

  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [consentFilter, setConsentFilter] = useState('ALL');

  // Record consent modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState(mockEmployees[0].id);
  const [consentStatusChoice, setConsentStatusChoice] = useState<'Opted-In' | 'Opted-Out'>('Opted-In');
  const [consentSourceProof, setConsentSourceProof] = useState('Employee Portal Electronic Signature');

  // Manual opt-out confirm state
  const [optOutTarget, setOptOutTarget] = useState<Employee | null>(null);

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.whatsappNumber.includes(searchTerm);
    const matchesFilter = consentFilter === 'ALL' || emp.consentStatus === consentFilter;
    return matchesSearch && matchesFilter;
  });

  const optedInCount = employees.filter((e) => e.consentStatus === 'Opted-In').length;
  const optedOutCount = employees.filter((e) => e.consentStatus === 'Opted-Out').length;
  const pendingCount = employees.filter(
    (e) => e.consentStatus === 'Pending Verification' || e.consentStatus === 'Unknown'
  ).length;

  const handleSaveConsent = (e: React.FormEvent) => {
    e.preventDefault();
    const target = employees.find((e) => e.id === targetEmployeeId);
    if (!target) return;

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === targetEmployeeId
          ? {
              ...emp,
              consentStatus: consentStatusChoice,
              consentSource: consentSourceProof,
              consentDate: '2026-10-30',
              optOutDate: consentStatusChoice === 'Opted-Out' ? '2026-10-30' : undefined,
            }
          : emp
      )
    );

    success(
      'Consent Record Registered',
      `Updated preference for ${target.name} to ${consentStatusChoice}.`
    );
    setIsRecordModalOpen(false);
  };

  const handleConfirmOptOut = () => {
    if (!optOutTarget) return;

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === optOutTarget.id
          ? {
              ...emp,
              consentStatus: 'Opted-Out',
              optOutDate: '2026-10-30',
              consentSource: 'Admin Manual Opt-Out Override',
            }
          : emp
      )
    );

    warning(
      'Opt-Out Enforced',
      `${optOutTarget.name} has been suppressed from all future WhatsApp broadcasts.`
    );
    setOptOutTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Consent & Opt-Out Management"
        description="Maintain explicit employee consent proof and instant opt-out suppression to comply with Meta Business policies and hospital privacy protocols."
      >
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Consent / Opt-Out</span>
        </button>
      </PageHeader>

      {/* Meta Policy Protection Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-950 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Dual-Gate Suppression Guarantee:</strong> Employees with <code>Opted-Out</code> status are automatically blocked at two independent checkpoints: (1) During campaign recipient selection in the wizard, and (2) At real-time queue dispatch immediately before sending to WATI.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Opted-In (Consented Staff)"
          value={optedInCount}
          subtitle="Signed induction form / ESS portal"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <StatCard
          title="Opted-Out Staff"
          value={optedOutCount}
          subtitle="STOP keyword / manual suppression"
          icon={UserX}
          accentColor="rose"
        />
        <StatCard
          title="Pending Verification"
          value={pendingCount}
          subtitle="Awaiting digital acknowledgment"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Consent Register Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff, ID, WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Preferences</option>
              <option value="Opted-In">Opted-In Only</option>
              <option value="Opted-Out">Opted-Out Only</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong>{filtered.length}</strong> staff preferences
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Department & Category</th>
                <th className="py-3 px-4">Masked WhatsApp</th>
                <th className="py-3 px-4">Consent Status</th>
                <th className="py-3 px-4">Proof / Source</th>
                <th className="py-3 px-4">Consent Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{emp.employeeId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{emp.department}</div>
                    <div className="text-[11px] text-slate-400">{emp.category}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {emp.maskedNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={emp.consentStatus} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs" title={emp.consentSource}>
                    {emp.consentSource || 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{emp.consentDate || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    {emp.consentStatus === 'Opted-In' ? (
                      <button
                        onClick={() => setOptOutTarget(emp)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <UserX className="w-3.5 h-3.5" /> Record Opt-Out
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTargetEmployeeId(emp.id);
                          setConsentStatusChoice('Opted-In');
                          setIsRecordModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Re-consent
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Consent / Opt-Out Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Record Employee Consent Preference</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveConsent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeId} - {e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consent Preference *
                </label>
                <select
                  value={consentStatusChoice}
                  onChange={(e) => setConsentStatusChoice(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="Opted-In">Opted-In (Consent Granted)</option>
                  <option value="Opted-Out">Opted-Out (Revoke / Do Not Broadcast)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Source / Proof of Consent *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Portal E-Sign / Physical Signed Form #882"
                  value={consentSourceProof}
                  onChange={(e) => setConsentSourceProof(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Opt-Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(optOutTarget)}
        title="Record WhatsApp Opt-Out?"
        message={`Are you sure you want to record an opt-out for ${optOutTarget?.name}? They will be immediately suppressed from all future hospital broadcast messages.`}
        confirmLabel="Record Opt-Out"
        variant="danger"
        onConfirm={handleConfirmOptOut}
        onCancel={() => setOptOutTarget(null)}
      />
    </div>
  );
};
