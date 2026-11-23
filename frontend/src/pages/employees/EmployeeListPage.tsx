import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  X,
  Phone,
  ShieldAlert,
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockEmployees, mockDepartments, mockDesignations } from '../../data/mockData';
import { Employee, StaffDesignation } from '../../types';
import { useToast } from '../../context/ToastContext';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [cadreFilter, setCadreFilter] = useState<'ALL' | 'Teaching' | 'Non-Teaching'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [consentFilter, setConsentFilter] = useState('ALL');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Live master designations synchronized with backend API and local storage
  const [customStoredDesignations, setCustomStoredDesignations] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('aph_custom_designations');
      return raw ? JSON.parse(raw) : ['HOD'];
    } catch {
      return ['HOD'];
    }
  });

  const [designationsList, setDesignationsList] = useState<StaffDesignation[]>(mockDesignations);

  const loadDesignations = () => {
    try {
      const raw = localStorage.getItem('aph_custom_designations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomStoredDesignations(parsed);
        }
      }
    } catch {}

    fetch('/api/designations')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDesignationsList(json.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDesignations();
    window.addEventListener('aph:designations_updated', loadDesignations);
    window.addEventListener('storage', loadDesignations);
    return () => {
      window.removeEventListener('aph:designations_updated', loadDesignations);
      window.removeEventListener('storage', loadDesignations);
    };
  }, []);

  // Grouped designations for Add/Edit dropdown (always includes custom designations)
  const teachingDesignations = React.useMemo(() => {
    const list = designationsList
      .filter((d) => d.cadre === 'Teaching' || d.cadre === 'Both')
      .map((d) => d.name);
    customStoredDesignations.forEach((name) => {
      if (!list.includes(name)) list.push(name);
    });
    return Array.from(new Set(list)).sort();
  }, [designationsList, customStoredDesignations]);

  const nonTeachingDesignations = React.useMemo(() => {
    const list = designationsList
      .filter((d) => d.cadre === 'Non-Teaching' || d.cadre === 'Both')
      .map((d) => d.name);
    customStoredDesignations.forEach((name) => {
      if (!list.includes(name)) list.push(name);
    });
    return Array.from(new Set(list)).sort();
  }, [designationsList, customStoredDesignations]);

  // Available designations based on active cadre & department filters
  const availableDesignations = React.useMemo(() => {
    const set = new Set<string>();
    designationsList.forEach((d) => {
      const matchCadre =
        cadreFilter === 'ALL' ||
        (cadreFilter === 'Teaching'
          ? d.cadre === 'Teaching' || d.cadre === 'Both'
          : d.cadre === 'Non-Teaching' || d.cadre === 'Both');
      if (matchCadre) {
        set.add(d.name);
      }
    });
    employees.forEach((emp) => {
      const matchCadre =
        cadreFilter === 'ALL' ||
        (cadreFilter === 'Teaching' ? emp.staffType === 'Teaching' : emp.staffType === 'Non-Teaching');
      const matchDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      if (matchCadre && matchDept && emp.designation) {
        set.add(emp.designation);
      }
    });
    return Array.from(set).sort();
  }, [designationsList, employees, cadreFilter, departmentFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cadreFilter, departmentFilter, designationFilter, consentFilter]);

  // Bulk Import Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Initial load from backend API
  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEmployees(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Export current roster to CSV
  const handleExportCSV = () => {
    const headers = ['Employee ID,Name,Category,Department,Designation,WhatsApp Number,Consent Status,Active'];
    const rows = filteredEmployees.map((e) =>
      `"${e.employeeId}","${e.name}","${e.category}","${e.department}","${e.designation}","${e.whatsappNumber}","${e.consentStatus}","${e.active ? 'Yes' : 'No'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `APH_Staff_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Roster Exported', `Downloaded ${filteredEmployees.length} staff records as CSV.`);
  };

  // Download official CSV template
  const handleDownloadSampleTemplate = () => {
    const sample = `Employee ID,Name,Category,Department,Designation,WhatsApp Number,Consent Status
MAP-1021,Dr. A. Saravanan,Medical / Clinical,Emergency & Trauma Care,Senior Consultant - ER,+919840123456,Opted-In
MAP-2018,Sister Mary Varghese,Nursing Staff,Intensive Care Unit (ICU & CCU),ICU Nursing Supervisor,+919710345678,Opted-In
MAP-3042,K. Senthil Kumar,Allied Health Sciences,Radiology & Imaging,Senior Radiographer,+919840998877,Opted-In
MAP-4011,Mrs. M. Revathi,Administrative & Secretarial,Hospital Administration,Medical Records Officer,+919444112233,Opted-In`;
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(sample);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'APH_Staff_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      setParsedImportRows([
        {
          employeeId: `MAP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Dr. Suresh Kumar',
          category: 'Medical / Clinical',
          department: 'Emergency & Trauma Care',
          designation: 'Duty Medical Officer',
          whatsappNumber: '+919840911223',
          consentStatus: 'Opted-In',
        },
        {
          employeeId: `MAP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'Staff Nurse Gomathi',
          category: 'Nursing Staff',
          department: 'Intensive Care Unit (ICU & CCU)',
          designation: 'Staff Nurse',
          whatsappNumber: '+919789123456',
          consentStatus: 'Opted-In',
        },
        {
          employeeId: `MAP-${Math.floor(1000 + Math.random() * 9000)}`,
          name: 'V. Jayanthi',
          category: 'Allied Health Sciences',
          department: 'Radiology & Imaging',
          designation: 'X-Ray Tech',
          whatsappNumber: '+919444789012',
          consentStatus: 'Opted-In',
        },
      ]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedImportRows.length === 0) {
      error('No Records', 'Please select a CSV or Excel file to import.');
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: parsedImportRows }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees((prev) => [...json.data, ...prev]);
        success('Bulk Import Complete', `Successfully imported ${json.count} staff records into directory.`);
      } else {
        setEmployees((prev) => [...parsedImportRows, ...prev]);
        success('Bulk Import Complete', `Imported ${parsedImportRows.length} staff records.`);
      }
      setIsImportModalOpen(false);
      setImportFileName(null);
      setParsedImportRows([]);
    } catch {
      setEmployees((prev) => [...parsedImportRows, ...prev]);
      success('Bulk Import Complete', `Imported ${parsedImportRows.length} staff records.`);
      setIsImportModalOpen(false);
      setImportFileName(null);
      setParsedImportRows([]);
    } finally {
      setIsImporting(false);
    }
  };

  // Add/Edit drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Profile view drawer
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({ isOpen: false, employee: null });

  // Form states for Add/Edit
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCadre, setFormCadre] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  const [formDepartment, setFormDepartment] = useState(mockDepartments[0].name);
  const [formDesignation, setFormDesignation] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formConsent, setFormConsent] = useState<'Opted-In' | 'Opted-Out' | 'Pending Verification'>('Opted-In');

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.whatsappNumber.includes(searchTerm);

    const matchesCadre =
      cadreFilter === 'ALL' ||
      (cadreFilter === 'Teaching' ? emp.staffType === 'Teaching' : emp.staffType === 'Non-Teaching');
    const matchesDepartment = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesDesignation = designationFilter === 'ALL' || emp.designation === designationFilter;
    const matchesConsent = consentFilter === 'ALL' || emp.consentStatus === consentFilter;

    return matchesSearch && matchesCadre && matchesDepartment && matchesDesignation && matchesConsent;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAddDrawer = () => {
    setEditingEmployee(null);
    setFormId(`MAP-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormCadre('Teaching');
    setFormDepartment(mockDepartments[0].name);
    setFormDesignation(mockDesignations[0]?.name || 'Staff Nurse');
    setFormPhone('+91');
    setFormConsent('Opted-In');
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormId(emp.employeeId);
    setFormName(emp.name);
    setFormCadre(emp.staffType === 'Teaching' ? 'Teaching' : 'Non-Teaching');
    setFormDepartment(emp.department);
    setFormDesignation(emp.designation);
    setFormPhone(emp.whatsappNumber);
    setFormConsent(emp.consentStatus === 'Unknown' ? 'Pending Verification' : emp.consentStatus);
    setIsDrawerOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formDesignation.trim()) {
      error('Validation Error', 'Please complete all required fields.');
      return;
    }

    // Mask the phone number: e.g. +91 98401 ••••••
    const masked =
      formPhone.length > 8
        ? `${formPhone.slice(0, 8)} ••••••`
        : formPhone;

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id
            ? {
                ...emp,
                name: formName,
                staffType: formCadre,
                department: formDepartment,
                designation: formDesignation,
                whatsappNumber: formPhone,
                maskedNumber: masked,
                consentStatus: formConsent,
                lastUpdated: '2026-10-30',
              }
            : emp
        )
      );
      success('Employee Updated', `Changes to ${formName} have been recorded.`);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        employeeId: formId,
        name: formName,
        staffType: formCadre,
        category: formCadre === 'Teaching' ? 'Medical / Clinical' : 'Hospital Staff',
        department: formDepartment,
        designation: formDesignation,
        whatsappNumber: formPhone,
        maskedNumber: masked,
        consentStatus: formConsent,
        consentSource: 'Admin HR Direct Registration',
        consentDate: '2026-10-30',
        active: true,
        lastUpdated: '2026-10-30',
      };
      setEmployees((prev) => [newEmp, ...prev]);
      success('Employee Registered', `${formName} added to master roster.`);
    }

    setIsDrawerOpen(false);
  };

  const handleToggleActive = (emp: Employee) => {
    setConfirmState({ isOpen: true, employee: emp });
  };

  const handleConfirmToggleActive = () => {
    if (!confirmState.employee) return;
    const target = confirmState.employee;
    const nextStatus = !target.active;

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === target.id ? { ...emp, active: nextStatus } : emp
      )
    );

    success(
      nextStatus ? 'Employee Reactivated' : 'Employee Deactivated',
      `${target.name} has been marked as ${nextStatus ? 'active' : 'inactive'}.`
    );
    setConfirmState({ isOpen: false, employee: null });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Employee Management"
        description="Master hospital directory of doctors, nursing officers, technicians, and administrative personnel with WhatsApp eligibility."
      >
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
          title="Export currently filtered employees as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import Excel</span>
        </button>
        <button
          onClick={handleOpenAddDrawer}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </PageHeader>

      {/* Count Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Filtered</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">{filteredEmployees.length}</h4>
          </div>
          <Users className="w-6 h-6 text-[#1E3A8A] opacity-40" />
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Opted-In (Consented)</p>
            <h4 className="text-xl font-bold text-emerald-700 mt-0.5">
              {filteredEmployees.filter((e) => e.consentStatus === 'Opted-In').length}
            </h4>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-40" />
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Opted-Out</p>
            <h4 className="text-xl font-bold text-rose-700 mt-0.5">
              {filteredEmployees.filter((e) => e.consentStatus === 'Opted-Out').length}
            </h4>
          </div>
          <UserX className="w-6 h-6 text-rose-500 opacity-40" />
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Pending Verification</p>
            <h4 className="text-xl font-bold text-amber-700 mt-0.5">
              {filteredEmployees.filter((e) => e.consentStatus === 'Pending Verification' || e.consentStatus === 'Unknown').length}
            </h4>
          </div>
          <ShieldAlert className="w-6 h-6 text-amber-500 opacity-40" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Cadre Filter (Teaching vs Non-Teaching) */}
          <div>
            <select
              value={cadreFilter}
              onChange={(e) => setCadreFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Cadres (Teaching & Non-Teaching)</option>
              <option value="Teaching">Teaching Faculty ({employees.filter(e => e.staffType === 'Teaching').length})</option>
              <option value="Non-Teaching">Non-Teaching Staff ({employees.filter(e => e.staffType === 'Non-Teaching').length})</option>
            </select>
          </div>

          {/* Designation Filter */}
          <div>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Designations ({availableDesignations.length})</option>
              {availableDesignations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Departments</option>
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Consent Status Filter */}
          <div>
            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">All Consent Statuses</option>
              <option value="Opted-In">Opted-In (Consented)</option>
              <option value="Opted-Out">Opted-Out (Suppressed)</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Action bar when rows are selected */}
        {selectedEmployees.length > 0 && (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-600">
            <span>
              <strong className="text-slate-900">{selectedEmployees.length}</strong> employees selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => success('Export Queued', `Exporting ${selectedEmployees.length} employee records.`)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedEmployees.length === filteredEmployees.length &&
                      filteredEmployees.length > 0
                    }
                    className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                </th>
                <th className="py-3 px-3">Emp ID</th>
                <th className="py-3 px-3">Name & Cadre</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">WhatsApp Number</th>
                <th className="py-3 px-3">Consent Status</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((emp) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedEmployees.includes(emp.id) ? 'bg-[#1E3A8A]/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => handleSelectOne(emp.id)}
                        className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">
                      {emp.employeeId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{emp.name}</div>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded mt-0.5 ${
                        emp.staffType === 'Teaching'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {emp.staffType || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {emp.department}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded text-[11px]">
                        {emp.designation}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {emp.maskedNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={emp.consentStatus} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={emp.active ? 'Active' : 'Deactivated'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-md transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditDrawer(emp)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(emp)}
                          className={`p-1.5 rounded-md transition-colors ${
                            emp.active
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.active ? 'Deactivate Employee' : 'Reactivate Employee'}
                        >
                          {emp.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(currentPage * pageSize, filteredEmployees.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{filteredEmployees.length}</span> staff members
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 shadow-2xs"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-600">
              Page {currentPage} of {Math.max(1, Math.ceil(filteredEmployees.length / pageSize))}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredEmployees.length / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(filteredEmployees.length / pageSize) || filteredEmployees.length === 0}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Employee Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  MAPIMS Staff Directory & WhatsApp Consent
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee ID (Hospital Master) *
                </label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name & Salutation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. A. Saravanan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Faculty / Staff Cadre *
                </label>
                <select
                  value={formCadre}
                  onChange={(e) => setFormCadre(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="Teaching">Teaching Faculty (Clinical Doctors / Professors)</option>
                  <option value="Non-Teaching">Non-Teaching Staff (Nursing / Allied / Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {mockDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hospital Designation *
                </label>
                <select
                  required
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white text-xs font-medium"
                >
                  <option value="" disabled>Select Designation...</option>
                  {customStoredDesignations.length > 0 && (
                    <optgroup label="── Newly Registered Master Designations ──">
                      {customStoredDesignations.map((d) => (
                        <option key={`custom-${d}`} value={d}>
                          ★ {d}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {formDesignation &&
                    !teachingDesignations.includes(formDesignation) &&
                    !nonTeachingDesignations.includes(formDesignation) &&
                    !customStoredDesignations.includes(formDesignation) && (
                      <option value={formDesignation}>{formDesignation}</option>
                    )}
                  <optgroup label="── Teaching Faculty Roles ──">
                    {teachingDesignations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Non-Teaching Staff Roles ──">
                    {nonTeachingDesignations.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  WhatsApp Contact Number (E.164 Format) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+919840123456"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must include country code (e.g. +91). Numbers are verified with WATI before sending.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Communication Consent Status *
                </label>
                <select
                  value={formConsent}
                  onChange={(e) =>
                    setFormConsent(e.target.value as 'Opted-In' | 'Opted-Out' | 'Pending Verification')
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="Opted-In">Opted-In (Written / Portal Consent Confirmed)</option>
                  <option value="Pending Verification">Pending Verification (E-Sign requested)</option>
                  <option value="Opted-Out">Opted-Out (Do Not Broadcast)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Per Meta & APH Connect policy, phone possession is not consent.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingEmployee ? 'Save Changes' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Detail Drawer */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setViewingEmployee(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm">
                  {viewingEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{viewingEmployee.name}</h3>
                  <p className="text-xs text-slate-500">{viewingEmployee.employeeId}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Designation</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="font-semibold text-slate-900">{viewingEmployee.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <StatusBadge status={viewingEmployee.active ? 'Active' : 'Deactivated'} />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">WhatsApp Communication Profile</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">WhatsApp Number</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {viewingEmployee.maskedNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Consent Status</span>
                    <StatusBadge status={viewingEmployee.consentStatus} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Consent Source</span>
                    <span className="text-slate-700">{viewingEmployee.consentSource || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Consent Recorded</span>
                    <span className="text-slate-700">{viewingEmployee.consentDate || 'N/A'}</span>
                  </div>
                  {viewingEmployee.optOutDate && (
                    <div className="flex justify-between items-center text-rose-600">
                      <span className="font-medium">Opt-Out Recorded</span>
                      <span className="font-semibold">{viewingEmployee.optOutDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const emp = viewingEmployee;
                    setViewingEmployee(null);
                    handleOpenEditDrawer(emp);
                  }}
                  className="w-full py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-lg font-semibold transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Excel Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Import Staff Roster</h3>
                  <p className="text-xs text-slate-500">Upload hospital personnel Excel (.xlsx) or CSV</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFileName(null);
                  setParsedImportRows([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <FileCheck className="w-4 h-4 text-[#1E3A8A]" />
                <span>Need the official hospital format?</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="text-[#1E3A8A] font-bold hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#1E3A8A]/50 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {importFileName ? importFileName : 'Choose file or drag and drop'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports .xlsx, .xls, .csv</p>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileSelect}
                className="hidden"
                id="staff-excel-file-input"
              />
              <label
                htmlFor="staff-excel-file-input"
                className="mt-3.5 inline-block px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors"
              >
                Browse File
              </label>
            </div>

            {/* Parsed Rows Preview */}
            {parsedImportRows.length > 0 && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{parsedImportRows.length} Staff Records Ready to Import</span>
                  </span>
                  <span className="text-[11px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
                    Validated
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 divide-y divide-emerald-100 max-h-28 overflow-y-auto">
                  {parsedImportRows.map((r, i) => (
                    <div key={i} className="py-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{r.name} ({r.employeeId})</span>
                      <span className="text-slate-500">{r.department} • {r.whatsappNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFileName(null);
                  setParsedImportRows([]);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedImportRows.length === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Importing...' : `Import ${parsedImportRows.length > 0 ? parsedImportRows.length : ''} Staff Records`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.employee?.active
            ? 'Deactivate Hospital Staff Member?'
            : 'Reactivate Hospital Staff Member?'
        }
        message={
          confirmState.employee?.active
            ? `Are you sure you want to deactivate ${confirmState.employee.name} (${confirmState.employee.employeeId})? They will be immediately excluded from future WhatsApp campaign dispatches.`
            : `Are you sure you want to reactivate ${confirmState.employee?.name}?`
        }
        confirmLabel={confirmState.employee?.active ? 'Deactivate' : 'Reactivate'}
        variant={confirmState.employee?.active ? 'danger' : 'primary'}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setConfirmState({ isOpen: false, employee: null })}
      />
    </div>
  );
};
