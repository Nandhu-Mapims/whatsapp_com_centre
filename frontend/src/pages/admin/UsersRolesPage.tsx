import React, { useState } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Search,
  Edit2,
  Power,
  Shield,
  CheckCircle2,
  XCircle,
  X,
  Key,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { mockUsers } from '../../data/mockData';
import { User, UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';

export const UsersRolesPage: React.FC = () => {
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Campaign Creator');

  // Deactivate confirm state
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Campaign Creator',
    'Approver',
    'Viewer',
  ];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Campaign Creator');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      error('Validation Error', 'Name and Email are required.');
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: formName, email: formEmail, role: formRole }
            : u
        )
      );
      success('User Updated', `Account permissions updated for ${formName}.`);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formName,
        email: formEmail,
        role: formRole,
        active: true,
        lastLogin: 'Never',
      };
      setUsers((prev) => [...prev, newUser]);
      success('User Created', `Invited ${formName} with role ${formRole}.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = () => {
    if (!confirmUser) return;
    const nextActive = !confirmUser.active;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === confirmUser.id ? { ...u, active: nextActive } : u
      )
    );
    success(
      nextActive ? 'Account Reactivated' : 'Account Deactivated',
      `User account status updated.`
    );
    setConfirmUser(null);
  };

  // Permission Matrix Data from Requirements Section D
  const matrixRows = [
    { capability: 'Dashboard Overview', superAdmin: 'All', admin: 'All', creator: 'Scoped', approver: 'Scoped', viewer: 'Scoped' },
    { capability: 'Employees CRUD', superAdmin: 'Full', admin: 'Full', creator: 'View Only', approver: 'View Only', viewer: 'None' },
    { capability: 'Categories & Depts', superAdmin: 'Full', admin: 'Full', creator: 'View Only', approver: 'View Only', viewer: 'None' },
    { capability: 'Templates & Media', superAdmin: 'Manage', admin: 'Manage', creator: 'Draft & Use', approver: 'View Only', viewer: 'None' },
    { capability: 'Create Campaign', superAdmin: 'Yes', admin: 'Yes', creator: 'Yes (Own)', approver: 'No', viewer: 'No' },
    { capability: 'Approve Campaign', superAdmin: 'Yes (Other users)', admin: 'Yes (Other users)', creator: 'No (Self-approval blocked)', approver: 'Assigned', viewer: 'No' },
    { capability: 'Schedule & Dispatch', superAdmin: 'Yes (Post-Approval)', admin: 'Yes (Post-Approval)', creator: 'Request Only', approver: 'No', viewer: 'No' },
    { capability: 'Retry Failed Sends', superAdmin: 'Yes', admin: 'Yes', creator: 'No', approver: 'No', viewer: 'No' },
    { capability: 'WATI Integration Secrets', superAdmin: 'Full', admin: 'No Access', creator: 'No Access', approver: 'No Access', viewer: 'No Access' },
    { capability: 'Audit Logs', superAdmin: 'Full Audit Trail', admin: 'Read Only', creator: 'No Access', approver: 'No Access', viewer: 'No Access' },
    { capability: 'Consent Records', superAdmin: 'Manage', admin: 'Manage', creator: 'Eligibility Check', approver: 'Eligibility Check', viewer: 'No Access' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Access Governance"
        description="Enforce least-privilege role-based access control (RBAC) and separation of duties for all hospital administrators."
      >
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin User</span>
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === 'USERS'
                ? 'bg-white shadow-2xs font-bold text-[#1E3A8A]'
                : 'text-slate-600'
            }`}
          >
            Authorized Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTab === 'MATRIX'
                ? 'bg-white shadow-2xs font-bold text-[#1E3A8A]'
                : 'text-slate-600'
            }`}
          >
            RBAC Permission Matrix
          </button>
        </div>

        {activeTab === 'USERS' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        )}
      </div>

      {/* TAB 1: Users List */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Last Login (IST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[11px]">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded border border-[#1E3A8A]/10">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.lastLogin}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.active ? 'Active' : 'Deactivated'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmUser(u)}
                          className={`p-1.5 rounded ${
                            u.active
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.active ? 'Deactivate' : 'Reactivate'}
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
      )}

      {/* TAB 2: RBAC Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-xs text-slate-900">
              Hospital RBAC Capability Enforcement Matrix
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Governed by the backend token verification middleware. Creators cannot self-approve.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">System Capability</th>
                  <th className="py-3 px-3">Super Admin</th>
                  <th className="py-3 px-3">Admin</th>
                  <th className="py-3 px-3">Campaign Creator</th>
                  <th className="py-3 px-3">Approver</th>
                  <th className="py-3 px-3">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matrixRows.map((row) => (
                  <tr key={row.capability} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.capability}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">{row.superAdmin}</td>
                    <td className="py-3 px-3 text-slate-800">{row.admin}</td>
                    <td className="py-3 px-3 text-slate-700">{row.creator}</td>
                    <td className="py-3 px-3 text-slate-700">{row.approver}</td>
                    <td className="py-3 px-3 text-slate-400">{row.viewer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Edit User Credentials' : 'Add New Hospital Admin'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Ramesh"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@mapims.org"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingUser ? 'Save Changes' : 'Invite User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={Boolean(confirmUser)}
        title={confirmUser?.active ? 'Deactivate User Account?' : 'Reactivate User Account?'}
        message={
          confirmUser?.active
            ? `Are you sure you want to disable access for ${confirmUser.name}? They will not be able to log in.`
            : `Are you sure you want to restore access for ${confirmUser?.name}?`
        }
        confirmLabel={confirmUser?.active ? 'Deactivate' : 'Reactivate'}
        variant={confirmUser?.active ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  );
};
