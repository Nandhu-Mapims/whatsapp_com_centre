import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Layers,
  Building2,
  FileText,
  Palette,
  Image as ImageIcon,
  Send,
  FileEdit,
  CalendarClock,
  History,
  CheckSquare,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  DownloadCloud,
  ShieldAlert,
  Radio,
  FileSearch,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Hospital,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'maroon' | 'amber' | 'blue';
  allowedRoles?: UserRole[];
}

interface NavSection {
  title: string;
  key: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  items: NavItem[];
}

export const AppSidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
}) => {
  const { currentUser } = useAuth();

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    employees: true,
    templates: true,
    campaigns: true,
    reports: true,
    admin: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: NavSection[] = [
    {
      title: 'Employee Management',
      key: 'employees',
      icon: Users,
      items: [
        { title: 'Employee List', path: '/employees', icon: Users },
        { title: 'Import Employees', path: '/employees/import', icon: UserPlus },
        { title: 'Staff Designations', path: '/employees/designations', icon: Layers },
        { title: 'Department Mgmt', path: '/employees/departments', icon: Building2 },
      ],
    },
    {
      title: 'WhatsApp Templates',
      key: 'templates',
      icon: FileText,
      items: [
        { title: 'Template Library', path: '/templates', icon: FileText },
        { title: 'Template Designer', path: '/templates/designer', icon: Palette },
        { title: 'Media Library', path: '/templates/media', icon: ImageIcon },
      ],
    },
    {
      title: 'Campaign Management',
      key: 'campaigns',
      icon: Send,
      items: [
        { title: 'Create Broadcast', path: '/campaigns/create', icon: Send },
        { title: 'Broadcast History', path: '/campaigns/history', icon: History },
      ],
    },
    {
      title: 'Reports & Monitoring',
      key: 'reports',
      icon: BarChart3,
      items: [
        { title: 'Delivery Reports', path: '/reports/delivery', icon: BarChart3 },
      ],
    },
    {
      title: 'Administration',
      key: 'admin',
      icon: ShieldAlert,
      allowedRoles: ['Super Admin'],
      items: [
        { title: 'Users & Roles', path: '/admin/users', icon: ShieldAlert, allowedRoles: ['Super Admin'] },
        { title: 'WATI Integration', path: '/admin/wati', icon: Radio, allowedRoles: ['Super Admin'] },
        { title: 'Audit Logs', path: '/admin/audit', icon: FileSearch, allowedRoles: ['Super Admin'] },
        { title: 'Consent & Opt-Outs', path: '/admin/consent', icon: UserCheck, allowedRoles: ['Super Admin'] },
      ],
    },
  ];

  const visibleSections = sections
    .filter((s) => !s.allowedRoles || s.allowedRoles.includes(currentUser.role))
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => !item.allowedRoles || item.allowedRoles.includes(currentUser.role)),
    }))
    .filter((s) => s.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1b2d50] text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B2846] to-[#243B67] flex items-center justify-center text-white shadow-md ring-1 ring-white/20">
            <Hospital className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>APH Connect</span>
                <span className="text-[10px] font-normal px-1.5 py-0.2 bg-[#7B2846] text-white rounded">
                  MAPIMS
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">Employee Communication Platform</p>
            </div>
          )}
        </div>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4">
        {/* 01. Dashboard Single Nav */}
        <div>
          <NavLink
            to="/dashboard"
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-white/15 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-white" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>
        </div>

        {/* 5 Grouped Modules */}
        {visibleSections.map((section) => {
          const isOpen = openSections[section.key] ?? true;
          return (
            <div key={section.key} className="space-y-1">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <section.icon className="w-3.5 h-3.5 opacity-70" />
                    {section.title}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {(isOpen || isCollapsed) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                          isActive
                            ? 'bg-[#7B2846] text-white shadow-xs font-semibold'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                            item.badgeVariant === 'maroon'
                              ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                              : item.badgeVariant === 'amber'
                              ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                              : 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 text-[11px] text-slate-400 bg-black/10">
          <div className="flex items-center justify-between">
            <span>WATI Gateway:</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="mt-1 text-slate-400 text-[10px]">v1.0.4 • Hospital Enterprise</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 z-30 shadow-xl',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1b2d50] shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
