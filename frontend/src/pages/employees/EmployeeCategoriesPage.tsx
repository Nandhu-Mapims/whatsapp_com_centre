import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Power,
  Users,
  Building2,
  X,
  GraduationCap,
  Download,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockDesignations, mockDepartments } from '../../data/mockData';
import { StaffDesignation } from '../../types';
import { useToast } from '../../context/ToastContext';

export const EmployeeCategoriesPage: React.FC = () => {
  const { success, error } = useToast();
  const [designations, setDesignations] = useState<StaffDesignation[]>(mockDesignations);
  const [searchTerm, setSearchTerm] = useState('');
  const [cadreFilter, setCadreFilter] = useState<'ALL' | 'Teaching' | 'Non-Teaching'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<StaffDesignation | null>(null);
  const [formName, setFormName] = useState('');

  // Deactivate confirm state
  const [confirmDesig, setConfirmDesig] = useState<StaffDesignation | null>(null);

  // Sync designations from live backend API on mount
  React.useEffect(() => {
    fetch('/api/designations')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDesignations(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredDesignations = designations.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.departments.some((dept) => dept.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCadre =
      cadreFilter === 'ALL' ||
      d.cadre === cadreFilter ||
      (d.cadre === 'Both' && (cadreFilter === 'Teaching' || cadreFilter === 'Non-Teaching'));
    return matchesSearch && matchesCadre;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDesignations.length / pageSize));
  const paginatedDesignations = filteredDesignations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const teachingCount = designations.filter((d) => d.cadre === 'Teaching' || d.cadre === 'Both').length;
  const nonTeachingCount = designations.filter((d) => d.cadre === 'Non-Teaching' || d.cadre === 'Both').length;
  const totalStaffAssigned = designations.reduce((acc, curr) => acc + curr.employeeCount, 0);

  const handleOpenAdd = () => {
    setEditingDesig(null);
    setFormName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (desig: StaffDesignation) => {
    setEditingDesig(desig);
    setFormName(desig.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      error('Validation Error', 'Designation Title is required.');
      return;
    }

    const cleanTitle = formName.trim();

    // Persist immediately to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('aph_custom_designations') || '[]');
      if (!stored.includes(cleanTitle)) {
        localStorage.setItem('aph_custom_designations', JSON.stringify([cleanTitle, ...stored]));
      }
    } catch {}

    try {
      const res = await fetch('/api/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanTitle, cadre: 'Both' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDesignations((prev) => [json.data, ...prev.filter((d) => d.id !== json.data.id)]);
      } else {
        const fallback: StaffDesignation = {
          id: `desig-${Date.now()}`,
          name: cleanTitle,
          cadre: 'Non-Teaching',
          employeeCount: 0,
          departmentCount: 0,
          departments: [],
          active: true,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setDesignations((prev) => [fallback, ...prev]);
      }
    } catch {
      const fallback: StaffDesignation = {
        id: `desig-${Date.now()}`,
        name: cleanTitle,
        cadre: 'Non-Teaching',
        employeeCount: 0,
        departmentCount: 0,
        departments: [],
        active: true,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setDesignations((prev) => [fallback, ...prev]);
    }

    // Broadcast update across app so Employee Edit and filters update instantly
    window.dispatchEvent(new CustomEvent('aph:designations_updated'));
    success('Designation Master Saved', `Designation "${cleanTitle}" registered and synchronized.`);
    setIsModalOpen(false);
  };

  const handleToggleActive = () => {
    if (!confirmDesig) return;
    if (confirmDesig.active && confirmDesig.employeeCount > 0) {
      error(
        'Action Restricted',
        `Cannot deactivate designation "${confirmDesig.name}" because ${confirmDesig.employeeCount} active hospital staff hold this title.`
      );
      setConfirmDesig(null);
      return;
    }

    setDesignations((prev) =>
      prev.map((d) =>
        d.id === confirmDesig.id ? { ...d, active: !d.active } : d
      )
    );
    success(
      confirmDesig.active ? 'Designation Deactivated' : 'Designation Reactivated',
      `Status updated for "${confirmDesig.name}".`
    );
    setConfirmDesig(null);
  };

  const handleExportCSV = () => {
    const headers = ['Designation Title,Faculty Cadre,Active Staff Headcount,Departments Count,Primary Departments'];
    const rows = filteredDesignations.map(
      (d) =>
        `"${d.name}","${d.cadre}","${d.employeeCount}","${d.departmentCount}","${d.departments.join('; ')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `APH_Staff_Designations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Generated', `Exported ${filteredDesignations.length} designations as CSV.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Staff Designations"
        description="Manage official clinical and administrative job titles across Teaching Faculty and Non-Teaching Staff cadres."
      >
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Designation</span>
        </button>
      </PageHeader>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Designations
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{designations.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">{totalStaffAssigned} total hospital staff assigned</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#243B67] flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              Teaching Faculty Titles
            </span>
            <div className="text-2xl font-black text-purple-900 mt-1">{teachingCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Professors, Consultants, Residents</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Non-Teaching Titles
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{nonTeachingCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">Nurses, Technicians, Accounts, Admin</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search designations or departments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>

            <select
              value={cadreFilter}
              onChange={(e) => {
                setCadreFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            >
              <option value="ALL">All Cadres (Teaching & Non-Teaching)</option>
              <option value="Teaching">Teaching Faculty Titles</option>
              <option value="Non-Teaching">Non-Teaching Staff Titles</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredDesignations.length}</strong> of{' '}
            <strong className="text-slate-800">{designations.length}</strong> designations
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Designation Title</th>
                <th className="py-3 px-3">Faculty Cadre</th>
                <th className="py-3 px-3 text-center">Staff Headcount</th>
                <th className="py-3 px-3">Primary Departments</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedDesignations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No designations match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedDesignations.map((desig) => (
                  <tr key={desig.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-[#243B67]" />
                        <span>{desig.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md ${
                          desig.cadre === 'Teaching'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : desig.cadre === 'Both'
                            ? 'bg-blue-100 text-[#243B67] border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {desig.cadre}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
                        <Users className="w-3 h-3 text-slate-500" />
                        {desig.employeeCount}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {desig.departments.slice(0, 3).map((dept) => (
                          <span
                            key={dept}
                            className="inline-block px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[10px]"
                          >
                            {dept}
                          </span>
                        ))}
                        {desig.departments.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{desig.departments.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={desig.active ? 'Active' : 'Deactivated'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(desig)}
                          className="p-1.5 text-slate-500 hover:text-[#243B67] hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Designation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDesig(desig)}
                          className={`p-1.5 rounded-md transition-colors ${
                            desig.active
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={desig.active ? 'Deactivate' : 'Reactivate'}
                        >
                          <Power className="w-4 h-4" />
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
            Showing <strong className="text-slate-700">{filteredDesignations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-700">{Math.min(currentPage * pageSize, filteredDesignations.length)}</strong> of{' '}
            <strong className="text-slate-700">{filteredDesignations.length}</strong> designations
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
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingDesig ? 'Edit Designation Master' : 'Add Designation Master'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Hospital Master Entry
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Designation Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Resident, Staff Nurse, Optometrist"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                  autoFocus
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  {editingDesig ? 'Update Designation' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDesig)}
        title={
          confirmDesig?.active ? 'Deactivate Designation?' : 'Reactivate Designation?'
        }
        message={
          confirmDesig?.active
            ? `Are you sure you want to deactivate "${confirmDesig.name}"? If there are active staff members with this designation, deactivation will be prevented.`
            : `Are you sure you want to reactivate "${confirmDesig?.name}"?`
        }
        confirmLabel={confirmDesig?.active ? 'Deactivate' : 'Reactivate'}
        variant={confirmDesig?.active ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDesig(null)}
      />
    </div>
  );
};
