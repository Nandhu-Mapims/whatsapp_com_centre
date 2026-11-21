import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Power,
  Users,
  X,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockDepartments, mockCategories } from '../../data/mockData';
import { Department } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DepartmentManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [searchTerm, setSearchTerm] = useState('');
  

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(mockCategories[0].name);
  const [formHod, setFormHod] = useState('');

  // Confirm state
  const [confirmDept, setConfirmDept] = useState<Department | null>(null);

  const filteredDepts = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.hodName && d.hodName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormCode('');
    setFormName('');
    setFormCategory(mockCategories[0].name);
    setFormHod('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormCategory(dept.categoryName);
    setFormHod(dept.hodName || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      error('Validation Error', 'Code and Name are required.');
      return;
    }

    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                code: formCode.toUpperCase(),
                name: formName,
                categoryName: formCategory,
                hodName: formHod,
                updatedAt: '2026-10-30',
              }
            : d
        )
      );
      success('Department Updated', `Department "${formName}" updated.`);
    } else {
      // Check duplicate code
      if (departments.some((d) => d.code.toUpperCase() === formCode.toUpperCase())) {
        error('Duplicate Code', `Department code "${formCode}" already exists.`);
        return;
      }

      const newDept: Department = {
        id: `dept-${Date.now()}`,
        code: formCode.toUpperCase(),
        name: formName,
        categoryName: formCategory,
        employeeCount: 0,
        hodName: formHod,
        active: true,
        updatedAt: '2026-10-30',
      };
      setDepartments((prev) => [...prev, newDept]);
      success('Department Created', `Department "${formName}" added.`);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = () => {
    if (!confirmDept) return;
    const nextActive = !confirmDept.active;

    setDepartments((prev) =>
      prev.map((d) =>
        d.id === confirmDept.id ? { ...d, active: nextActive } : d
      )
    );
    success(
      nextActive ? 'Department Reactivated' : 'Department Deactivated',
      `Department status changed.`
    );
    setConfirmDept(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        description="Maintain hospital departments, clinical wings, and head of department (HOD) associations."
      >
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </PageHeader>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search code, department, HOD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>


          </div>

          <span className="text-xs text-slate-500">
            Showing <strong>{filteredDepts.length}</strong> departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dept Code</th>
                <th className="py-3 px-4">Department Name</th>

                <th className="py-3 px-4">HOD / Lead Contact</th>
                <th className="py-3 px-4">Active Staff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDepts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                      {d.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                  <td className="py-3 px-4 text-slate-600">{d.categoryName}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {d.hodName || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#243B67]" />
                      {d.employeeCount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={d.active ? 'Active' : 'Deactivated'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1.5 text-slate-500 hover:text-[#243B67] hover:bg-slate-100 rounded-md"
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDept(d)}
                        className={`p-1.5 rounded-md ${
                          d.active
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={d.active ? 'Deactivate' : 'Reactivate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDept ? 'Edit Hospital Department' : 'Create New Department'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMERG or ICU-CRIT"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency & Trauma Care"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked Employee Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                >
                  {mockCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HOD / In-charge Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. C. Karthikeyan"
                  value={formHod}
                  onChange={(e) => setFormHod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDept)}
        title={confirmDept?.active ? 'Deactivate Department?' : 'Reactivate Department?'}
        message={
          confirmDept?.active
            ? `Are you sure you want to deactivate "${confirmDept.name}"? Historical campaign references will be preserved.`
            : `Are you sure you want to reactivate "${confirmDept?.name}"?`
        }
        confirmLabel={confirmDept?.active ? 'Deactivate' : 'Reactivate'}
        variant={confirmDept?.active ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmDept(null)}
      />
    </div>
  );
};
