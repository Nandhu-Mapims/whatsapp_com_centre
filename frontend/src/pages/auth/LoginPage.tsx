import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Hospital,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { mockUsers } from '../../data/mockData';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('superadmin@mapims.org');
  const [password, setPassword] = useState('mapims2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination path after successful login
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        success('Authentication Successful', 'Welcome to APH Connect.');
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.message || 'Invalid credentials.');
        error('Login Failed', res.message || 'Please check your email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service error.');
      error('Service Error', 'Unable to authenticate at this moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('mapims2026');
    setIsLoading(true);
    setErrorMessage('');

    const res = await login(userEmail, 'mapims2026');
    if (res.success) {
      success('Demo Account Loaded', `Signed in with role privileges.`);
      navigate(from, { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Left Side: Hospital Branding & Clean Minimalist Panel (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1b2d50] via-[#243B67] to-[#7B2846] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background hospital pattern circles */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#7B2846]/30 blur-2xl pointer-events-none" />

          {/* Clean Brand Header */}
          <div className="relative z-10 my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20 shadow-lg mb-6">
              <Hospital className="w-8 h-8 text-white" />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight">APH Connect</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-md">
                MAPIMS
              </span>
            </div>
            <p className="text-sm text-slate-200 font-medium mt-1">
              Employee Communication Platform
            </p>

            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="inline-block text-[11px] font-bold text-amber-300 tracking-wider uppercase bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-300/20">
                One Platform. Every Employee. Connected.
              </span>
            </div>
          </div>

          {/* Footer Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span>Adhiparasakthi Hospitals</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Right Side: Sign-In Form (7 cols on lg) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Hospital Staff Portal Sign-In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate with your official MAPIMS credentials to continue.
                </p>
              </div>
              <div className="p-2 bg-slate-100 rounded-xl text-[#243B67] hidden sm:block">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Official Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@mapims.org"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]/20 focus:border-[#243B67] font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">Password *</label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Hospital Password Reset: Please contact Hospital IT Desk at Ext 104 or it.support@mapims.org.');
                    }}
                    className="text-[11px] font-semibold text-[#243B67] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter hospital password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]/20 focus:border-[#243B67] font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#243B67] focus:ring-[#243B67]"
                  />
                  <span>Remember this terminal</span>
                </label>
                <span className="text-[10px] text-slate-400">256-Bit TLS Protected</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#243B67] hover:bg-[#1a2c4e] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to APH Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Accounts (1-Click Login: Admin & Super Admin) */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Role Sign-In
              </span>
              <span className="text-[10px] text-slate-400">Select authorized role</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@mapims.org')}
                className="py-3 px-4 rounded-xl bg-slate-50 hover:bg-[#243B67] hover:text-white border border-slate-200/80 text-center transition-all group shadow-2xs font-bold text-slate-800 text-xs"
              >
                Super Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@mapims.org')}
                className="py-3 px-4 rounded-xl bg-slate-50 hover:bg-[#243B67] hover:text-white border border-slate-200/80 text-center transition-all group shadow-2xs font-bold text-slate-800 text-xs"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

