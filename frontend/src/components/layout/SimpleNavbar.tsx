import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
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
  Hospital,
  Bell,
  Shield,
  CheckCircle,
  Menu,
  X,
  User,
  LogOut,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface NavDropdownItem {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: 'maroon' | 'amber' | 'blue' | 'emerald';
  allowedRoles?: UserRole[];
}

interface NavGroup {
  key: string;
  label: string;
  basePath: string;
  allowedRoles?: UserRole[];
  items: NavDropdownItem[];
}

export const SimpleNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchRole, logout } = useAuth();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with native browser event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Could not exit fullscreen:', err);
      });
    }
  };

  const navRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const navGroups: NavGroup[] = [
    {
      key: 'employees',
      label: 'Employees',
      basePath: '/employees',
      allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
      items: [
        {
          title: 'Staff Directory',
          description: 'Search, add, bulk import Excel & export CSV',
          path: '/employees',
          icon: Users,
          allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
        },
        {
          title: 'Staff Designations',
          description: '149 hospital roles across Teaching & Non-Teaching',
          path: '/employees/designations',
          icon: Layers,
          allowedRoles: ['Super Admin', 'HR', 'MD'],
        },
        {
          title: 'Departments & Divisions',
          description: '54 clinical specialties, wards & hospital divisions',
          path: '/employees/departments',
          icon: Building2,
          allowedRoles: ['Super Admin', 'HR', 'MD'],
        },
      ],
    },
    {
      key: 'templates',
      label: 'Templates',
      basePath: '/templates',
      allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
      items: [
        {
          title: 'Template Library',
          description: 'Browse Meta-approved WhatsApp templates',
          path: '/templates',
          icon: FileText,
          allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
        },
        {
          title: 'Template Designer',
          description: 'Compose message drafts with live phone preview',
          path: '/templates/designer',
          icon: Palette,
          allowedRoles: ['Super Admin', 'MS', 'MD'],
        },
      ],
    },
    {
      key: 'campaigns',
      label: 'Campaigns',
      basePath: '/campaigns',
      allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
      items: [
        {
          title: 'Create Broadcast',
          description: 'Target staff & broadcast WhatsApp alert',
          path: '/campaigns/create',
          icon: Send,
          allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
        },
        {
          title: 'Broadcast History',
          description: 'Log of sent and scheduled broadcasts',
          path: '/campaigns/history',
          icon: History,
          allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
        },
      ],
    },
    {
      key: 'reports',
      label: 'Reports',
      basePath: '/reports',
      allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
      items: [
        {
          title: 'Delivery Reports',
          description: 'Real-time message telemetry, campaign status & recipient logs',
          path: '/reports/delivery',
          icon: BarChart3,
          allowedRoles: ['Super Admin', 'HR', 'MS', 'MD'],
        },
      ],
    },
    {
      key: 'admin',
      label: 'Admin',
      basePath: '/admin',
      allowedRoles: ['Super Admin'],
      items: [
        {
          title: 'Users & Roles',
          description: 'Staff accounts & RBAC permission matrix',
          path: '/admin/users',
          icon: ShieldAlert,
          allowedRoles: ['Super Admin'],
        },
        {
          title: 'WATI Integration',
          description: 'WhatsApp gateway health & template sync',
          path: '/admin/wati',
          icon: Radio,
          allowedRoles: ['Super Admin'],
        },
        {
          title: 'Audit Logs',
          description: 'Chronological security & dispatch trail',
          path: '/admin/audit',
          icon: FileSearch,
          allowedRoles: ['Super Admin'],
        },
        {
          title: 'Consent & Opt-Outs',
          description: 'Legal compliance & WhatsApp STOP suppression',
          path: '/admin/consent',
          icon: UserCheck,
          allowedRoles: ['Super Admin'],
        },
      ],
    },
  ];

  // Dynamically filter menu groups & items based on current active user role
  const visibleGroups = navGroups
    .filter((g) => !g.allowedRoles || g.allowedRoles.includes(currentUser.role))
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(currentUser.role)
      ),
    }))
    .filter((g) => g.items.length > 0);

  const roles: UserRole[] = [
    'Super Admin',
    'HR',
    'MS',
    'MD',
  ];

  const isCurrentSection = (basePath: string) => {
    return location.pathname.startsWith(basePath);
  };

  const getBadgeStyle = (variant?: 'maroon' | 'amber' | 'blue' | 'emerald') => {
    switch (variant) {
      case 'maroon':
        return 'bg-[#059669] text-white';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'blue':
      default:
        return 'bg-blue-100 text-[#1E3A8A] border border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/90 group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/mapims-logo.png"
                  alt="MAPIMS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900">
                    APH Connect
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-md border border-[#1E3A8A]/20">
                    MAPIMS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium leading-none mt-1">
                  Employee Communication Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Bar Menu */}
          <nav
            ref={navRef}
            className="hidden lg:flex items-center gap-1 xl:gap-1.5"
            aria-label="Main Navigation"
          >
            {/* Dashboard Link - Clean subtle pill style */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>

            {/* Dropdown Groups with unified sleek styling */}
            {visibleGroups.map((group) => {
              const isSectionActive = isCurrentSection(group.basePath);
              const isOpen = activeDropdown === group.key;

              return (
                <div key={group.key} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : group.key)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 focus:outline-none',
                      isSectionActive
                        ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
                      isOpen && 'bg-slate-100 text-slate-900'
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                        isOpen && 'rotate-180 opacity-100'
                      )}
                    />
                  </button>

                  {/* Dropdown Menu Popover */}
                  {isOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {group.items.length} options
                        </span>
                      </div>
                      <div className="py-1 space-y-0.5">
                        {group.items.map((item) => {
                          const isItemActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setActiveDropdown(null)}
                              className={cn(
                                'flex items-start gap-3 p-2.5 rounded-xl transition-all group',
                                isItemActive
                                  ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]'
                                  : 'hover:bg-slate-50 text-slate-700'
                              )}
                            >
                              <div
                                className={cn(
                                  'p-2 rounded-lg shrink-0 mt-0.5 transition-colors',
                                  isItemActive
                                    ? 'bg-[#1E3A8A] text-white'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#1E3A8A] group-hover:text-white'
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={cn(
                                      'text-xs font-bold truncate',
                                      isItemActive
                                        ? 'text-[#1E3A8A]'
                                        : 'text-slate-900 group-hover:text-[#1E3A8A]'
                                    )}
                                  >
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                                        getBadgeStyle(item.badgeVariant)
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: Role Switcher, Alerts & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher Pill */}
            <div ref={roleRef} className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                title="Switch User Role to test RBAC"
              >
                <Shield className="w-3.5 h-3.5 text-[#059669]" />
                <span className="hidden sm:inline text-slate-400 font-normal">Role:</span>
                <span className="text-[#1E3A8A] font-bold">{currentUser.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Interactive RBAC Tester
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
                      className={cn(
                        'w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors',
                        currentUser.role === r
                          ? 'font-bold text-[#1E3A8A] bg-[#1E3A8A]/5'
                          : 'text-slate-700'
                      )}
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

            {/* Notifications Alert Bell */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#059669] ring-2 ring-white" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">Operational Alerts</h4>
                    <span className="text-[10px] text-slate-500 font-medium">2 Unread</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    <div
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/campaigns/history');
                      }}
                      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-slate-800">
                        Broadcast Log Updated
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        New hospital broadcast notice has been registered.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                    </div>
                    <div
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/reports/delivery');
                      }}
                      className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
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

            {/* Fullscreen Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-xl transition-colors"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* User Profile Avatar with sleek popover instead of cropped text */}
            <div ref={profileRef} className="relative pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#172554] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shadow-2xs hover:ring-[#1E3A8A]/30 transition-all focus:outline-none"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.name.charAt(0)}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.role}</p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Account
                    </span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-700">
                    {currentUser.role === 'Super Admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/admin/users');
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>User Permissions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/admin/audit');
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                        >
                          <FileSearch className="w-3.5 h-3.5 text-slate-400" />
                          <span>System Audit Activity</span>
                        </button>
                      </>
                    )}

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-rose-50 text-rose-700 rounded-lg transition-colors text-left font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Dashboard Link */}
            <div>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors',
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-800 hover:bg-slate-100'
                  )
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
            </div>

            {/* All Groups for Mobile (filtered by active role) */}
            {visibleGroups.map((group) => (
              <div key={group.key} className="space-y-1 pt-2 border-t border-slate-100">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        location.pathname === item.path
                          ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            getBadgeStyle(item.badgeVariant)
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Mobile Sign Out */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of APH Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
