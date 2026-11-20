import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  moduleName?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  moduleName = 'this section',
}) => {
  const { currentUser, switchRole } = useAuth();

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Hospital enterprise governance and Role-Based Access Control (RBAC) restrict {moduleName} to the following authorized roles:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {allowedRoles.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#243B67]/10 text-[#243B67] border border-[#243B67]/20"
              >
                {r}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-400">
            Current Active Role: <strong>{currentUser.role}</strong> ({currentUser.name})
          </p>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            {allowedRoles[0] && (
              <button
                type="button"
                onClick={() => switchRole(allowedRoles[0])}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#243B67] hover:bg-[#1a2c4e] text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Switch to {allowedRoles[0]}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

