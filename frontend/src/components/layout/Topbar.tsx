import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface TopbarProps {
  onMobileToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMobileToggle,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentUser, switchRole } = useAuth();
  const location = useLocation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumb titles from pathname
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbTitle = (path: string) => {
    switch (path) {
      case 'dashboard':
        return 'Dashboard';
      case 'employees':
        return 'Employee Management';
      case 'import':
        return 'Import Employees';
      case 'designations':
      case 'categories':
        return 'Staff Designations';
      case 'departments':
        return 'Department Management';
      case 'templates':
        return 'WhatsApp Templates';
      case 'designer':
        return 'Template Designer';
      case 'media':
        return 'Media Library';
      case 'campaigns':
        return 'Campaign Management';
      case 'create':
        return 'Create Campaign';
      case 'drafts':
        return 'Draft Campaigns';
      case 'scheduled':
        return 'Schedule Campaigns';
      case 'history':
        return 'Campaign History';
      case 'approvals':
        return 'Campaign Approval';
      case 'reports':
        return 'Reports & Monitoring';
      case 'delivery':
        return 'Delivery Reports';
      case 'analytics':
        return 'Campaign Analytics';
      case 'failed':
        return 'Failed Messages';
      case 'export':
        return 'Export Reports';
      case 'admin':
        return 'Administration';
      case 'users':
        return 'Users & Roles';
      case 'wati':
        return 'WATI Integration';
      case 'audit':
        return 'Audit Logs';
      case 'consent':
        return 'Consent & Opt-Outs';
      default:
        return path;
    }
  };

  const roles: UserRole[] = [
    'Super Admin',
    'HR',
    'MS',
    'MD',
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left section: Hamburger / Collapse + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Breadcrumb nav */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-hidden">
          <Link to="/dashboard" className="hover:text-[#1E3A8A] transition-colors truncate">
            MAPIMS
          </Link>
          {pathnames.map((segment, index) => {
            const isLast = index === pathnames.length - 1;
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {isLast ? (
                  <span className="text-slate-900 font-semibold truncate capitalize">
                    {getBreadcrumbTitle(segment)}
                  </span>
                ) : (
                  <Link to={routeTo} className="hover:text-[#1E3A8A] transition-colors truncate capitalize">
                    {getBreadcrumbTitle(segment)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right section: Search bar, Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search simulation */}
        <div className="hidden lg:flex items-center relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee, ID, campaign..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>

        {/* Role Switcher for Interactive RBAC Demo */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
            title="Switch User Role to test RBAC"
          >
            <Shield className="w-3.5 h-3.5 text-[#059669]" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-[#1E3A8A] font-bold">{currentUser.role}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test RBAC Permissions
                </p>
                <p className="text-xs text-slate-600 mt-0.5">Switch active user role</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currentUser.role === r
                      ? 'font-bold text-[#1E3A8A] bg-[#1E3A8A]/5'
                      : 'text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  {currentUser.role === r && (
                    <CheckCircle className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#059669]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">Operational Alerts</h4>
                <span className="text-[10px] text-slate-500">2 Unread</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-slate-800">
                    Campaign Pending Approval
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    "NABH 5th Edition Mock Audit Readiness Notice" awaits review.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-semibold text-rose-600">
                    5 Failed Messages Detected
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rate limit & opt-out alerts on Campaign CMP-2026-089.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
