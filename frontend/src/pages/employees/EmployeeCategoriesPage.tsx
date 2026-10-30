import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Power,
  Users,
  Building2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockCategories } from '../../data/mockData';
import { EmployeeCategory } from '../../types';
import { useToast } from '../../context/ToastContext';

export const EmployeeCategoriesPage: React.FC = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<EmployeeCategory[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EmployeeCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState(1);

  // Deactivate confirm state
  const [confirmCategory, setConfirmCategory] = useState<EmployeeCategory | null>(null);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDesc('');
    setFormOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: EmployeeCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description);
    setFormOrder(cat.displayOrder);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      error('Validation Error', 'Category name is required.');
      return;
    }

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: formName,
                description: formDesc,
                displayOrder: formOrder,
                updatedAt: '2026-10-30',
              }
            : c
        )
      );
      success('Category Updated', `Category "${formName}" updated.`);
    } else {
      const newCat: EmployeeCategory = {
        id: `cat-${Date.now()}`,
        name: formName,
        description: formDesc,
        employeeCount: 0,
        departmentCount: 0,
        active: true,
        displayOrder: formOrder,
        updatedAt: '2026-10-30',
      };
      setCategories((prev) => [...prev, newCat]);
      success('Category Added', `Category "${formName}" created.`);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = () => {
    if (!confirmCategory) return;
    if (confirmCategory.active && confirmCategory.employeeCount > 0) {
      error(
        'Action Blocked',
        `Cannot deactivate category "${confirmCategory.name}" because ${confirmCategory.employeeCount} active hospital staff members are currently mapped to it.`
      );
      setConfirmCategory(null);
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === confirmCategory.id ? { ...c, active: !c.active } : c
      )
    );
    success(
      confirmCategory.active ? 'Category Deactivated' : 'Category Reactivated',
      `Category status changed.`
    );
    setConfirmCategory(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Categories"
        description="Configure top-level staff classifications used for targeted WhatsApp recipient segmenting and broadcasting."
      >
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </PageHeader>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.slice(0, 3).map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Order #{cat.displayOrder}
                </span>
                <StatusBadge status={cat.active ? 'Active' : 'Deactivated'} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#243B67]" />
                <strong>{cat.employeeCount}</strong> staff
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <strong>{cat.departmentCount}</strong> depts
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total <strong>{filteredCategories.length}</strong> categories defined
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16">Order</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Linked Staff</th>
                <th className="py-3 px-4">Linked Depts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    #{cat.displayOrder}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{cat.description}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{cat.employeeCount}</td>
                  <td className="py-3 px-4 text-slate-600">{cat.departmentCount}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={cat.active ? 'Active' : 'Deactivated'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-[#243B67] hover:bg-slate-100 rounded-md"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmCategory(cat)}
                        className={`p-1.5 rounded-md ${
                          cat.active
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={cat.active ? 'Deactivate' : 'Reactivate'}
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
                {editingCategory ? 'Edit Employee Category' : 'Create Employee Category'}
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
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allied Health Sciences"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Scope of staff included in this category..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmCategory)}
        title={
          confirmCategory?.active ? 'Deactivate Category?' : 'Reactivate Category?'
        }
        message={
          confirmCategory?.active
            ? `Are you sure you want to deactivate "${confirmCategory.name}"? If there are mapped employees, deactivation will be prevented.`
            : `Are you sure you want to reactivate "${confirmCategory?.name}"?`
        }
        confirmLabel={confirmCategory?.active ? 'Deactivate' : 'Reactivate'}
        variant={confirmCategory?.active ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmCategory(null)}
      />
    </div>
  );
};
