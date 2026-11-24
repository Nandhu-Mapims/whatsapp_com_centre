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
  Users,
  Stethoscope,
  Crown,
  AlertCircle,
  Check,
  Building2,
  Lock,
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
  const [formRole, setFormRole] = useState<UserRole>('HR');

  // Deactivate confirm state
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles: UserRole[] = [
    'Super Admin',
    'HR',
    'MS',
    'MD',
  ];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('HR');
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

  // Hospital RBAC Capability Matrix (Super Admin, HR, MS, MD)
  const matrixRows = [
    {
      category: 'Analytics & Reporting',
      capability: 'Executive Dashboard & KPI Analytics',
      superAdmin: 'Full System Scope',
      hr: 'Staff & Roster Metrics',
      ms: 'Clinical Delivery Funnel',
      md: 'Apex Executive KPIs',
    },
    {
      category: 'Roster Management',
      capability: 'Staff Directory (CRUD & Bulk Excel)',
      superAdmin: 'Full System Access',
      hr: 'Full CRUD & Import Lead',
      ms: 'View Only (Clinical)',
      md: 'View & Oversight',
    },
    {
      category: 'Roster Management',
      capability: 'Departments & Designation Mapping',
      superAdmin: 'Full Access',
      hr: 'Manage & Register',
      ms: 'View Only',
      md: 'View Only',
    },
    {
      category: 'Template Management',
      capability: 'WhatsApp Templates (WATI & Meta)',
      superAdmin: 'Author, Delete & Sync',
      hr: 'Use & Sync Templates',
      ms: 'Clinical Review & Sync',
      md: 'Approve, Delete & Sync',
    },
    {
      category: 'Broadcast Operations',
      capability: 'Create & Draft Broadcast Campaigns',
      superAdmin: 'All Campaigns',
      hr: 'All Staff Broadcasts',
      ms: 'Clinical Broadcasts',
      md: 'Executive & Emergency',
    },
    {
      category: 'Broadcast Operations',
      capability: 'Clinical Approval & Sign-Off',
      superAdmin: 'Global Override',
      hr: 'Blocked (No Self-Approval)',
      ms: 'Clinical Sign-Off (4-Eyes)',
      md: 'Apex Executive Sign-Off',
    },
    {
      category: 'Broadcast Operations',
      capability: 'Schedule & WATI Dispatch',
      superAdmin: 'Immediate & Scheduled',
      hr: 'Post-Approval Dispatch',
      ms: 'Approved Clinical Sends',
      md: 'Immediate Executive Sends',
    },
    {
      category: 'Delivery Diagnostics',
      capability: 'Live Delivery Reports (Nov 21+)',
      superAdmin: 'Full Real-Time Telemetry',
      hr: 'Staff Delivery Funnel',
      ms: 'Clinical Delivery & Reads',
      md: 'Hospital-Wide Telemetry',
    },
    {
      category: 'Delivery Diagnostics',
      capability: 'Failed Message Diagnostics & Retry',
      superAdmin: 'Auto (30m/1h) + Manual Send',
      hr: 'Diagnostics & Phone Edit',
      ms: 'Clinical Impact Diagnostics',
      md: 'Governance & Manual Send',
    },
    {
      category: 'Compliance & Safety',
      capability: 'Consent & Opt-Out Registry',
      superAdmin: 'Full System Access',
      hr: 'Full Registry Management',
      ms: 'View Only',
      md: 'View & Compliance',
    },
    {
      category: 'Security & Integration',
      capability: 'WATI Gateway API Configuration',
      superAdmin: 'Full Config & Keys',
      hr: 'Restricted (No Access)',
      ms: 'Restricted (No Access)',
      md: 'Restricted (No Access)',
    },
    {
      category: 'Security & Integration',
      capability: 'System Audit Logs & Traceability',
      superAdmin: 'Full Audit Trail',
      hr: 'Restricted (No Access)',
      ms: 'Restricted (No Access)',
      md: 'Full Audit Trail (Export)',
    },
    {
      category: 'Security & Integration',
      capability: 'User & Role Administration',
      superAdmin: 'Full User Management',
      hr: 'Restricted (No Access)',
      ms: 'Restricted (No Access)',
      md: 'Executive Oversight',
    },
  ];

  const renderPermissionBadge = (val: string) => {
    if (val.includes('Full') || val.includes('Yes') || val.includes('Override') || val.includes('Manage') || val.includes('Author')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>{val}</span>
        </span>
      );
    }
    if (val.includes('Clinical Sign-Off') || val.includes('Executive') || val.includes('Sign-Off') || val.includes('Apex') || val.includes('Approve')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
          <Shield className="w-3 h-3 text-[#1E3A8A] shrink-0" />
          <span>{val}</span>
        </span>
      );
    }
    if (val.includes('Draft') || val.includes('View') || val.includes('Post-Approval') || val.includes('Use') || val.includes('Metrics') || val.includes('Diagnostics')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span>{val}</span>
        </span>
      );
    }
    if (val.includes('Blocked') || val.includes('Restricted') || val.includes('No Access')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{val}</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200">
        {val}
      </span>
    );
  };

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
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                  Global Access
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Super Admin</h4>
                <p className="text-[11px] font-mono text-slate-500">superadmin@mapims.org</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Global IT and security administration. WATI gateway credentials, token rotation, audit trails, and emergency override.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-md">
                  Staff Lead
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">HR (Human Resources)</h4>
                <p className="text-[11px] font-mono text-slate-500">hr@mapims.org</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Staff directory operations, bulk Excel employee import, designation mapping, consent registry, and broadcast drafting.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  Clinical Approval
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">MS (Medical Supt)</h4>
                <p className="text-[11px] font-mono text-slate-500">ms@mapims.org</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mandatory 4-eyes clinical sign-off, clinical triage notices review, duty rosters oversight, and delivery diagnostics.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-md">
                  Apex Authority
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">MD (Managing Director)</h4>
                <p className="text-[11px] font-mono text-slate-500">md@mapims.org</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executive authority sign-off, high-priority emergency announcements, hospital-wide audit trails, and executive KPIs.
              </p>
            </div>
          </div>

          {/* Four-Eyes Governance Callout Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 rounded-xl flex items-start gap-3 shadow-2xs">
            <div className="p-2 bg-[#1E3A8A] text-white rounded-lg shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-900 block">
                NABH & Hospital Regulatory Policy: Strict Separation of Duties (Four-Eyes Principle)
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                To eliminate unauthorized or accidental WhatsApp transmissions to clinical staff, the system prevents broadcast creators from self-approving. Once HR drafts a circular, it must receive explicit sign-off from the <strong>Medical Superintendent (MS)</strong> for clinical verification or the <strong>Managing Director (MD)</strong> before WATI Meta dispatch is permitted.
              </p>
            </div>
          </div>

          {/* Detailed Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  Hospital Role-Based Access Control (RBAC) Governance Matrix
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enforced at the network edge by Express JWT route guards and frontend navigation filters.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold self-start sm:self-auto">
                4 Active Hospital Roles
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hospital System Capability</th>
                    <th className="py-3 px-3">
                      <div className="font-bold text-indigo-900">Super Admin</div>
                      <div className="text-[10px] text-slate-400 font-mono lowercase font-normal">superadmin@mapims.org</div>
                    </th>
                    <th className="py-3 px-3">
                      <div className="font-bold text-violet-900">HR (Human Resources)</div>
                      <div className="text-[10px] text-slate-400 font-mono lowercase font-normal">hr@mapims.org</div>
                    </th>
                    <th className="py-3 px-3">
                      <div className="font-bold text-emerald-900">MS (Medical Supt)</div>
                      <div className="text-[10px] text-slate-400 font-mono lowercase font-normal">ms@mapims.org</div>
                    </th>
                    <th className="py-3 px-3">
                      <div className="font-bold text-[#1E3A8A]">MD (Managing Dir)</div>
                      <div className="text-[10px] text-slate-400 font-mono lowercase font-normal">md@mapims.org</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {matrixRows.map((row) => (
                    <tr key={row.capability} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{row.capability}</div>
                        <div className="text-[10px] font-normal text-slate-400 uppercase tracking-wider mt-0.5">
                          {row.category}
                        </div>
                      </td>
                      <td className="py-3 px-3">{renderPermissionBadge(row.superAdmin)}</td>
                      <td className="py-3 px-3">{renderPermissionBadge(row.hr)}</td>
                      <td className="py-3 px-3">{renderPermissionBadge(row.ms)}</td>
                      <td className="py-3 px-3">{renderPermissionBadge(row.md)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
