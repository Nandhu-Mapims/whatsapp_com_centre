import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Send,
  CheckCheck,
  AlertOctagon,
  Clock,
  Plus,
  UserPlus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Radio,
  ExternalLink,
  Calendar,
  Sparkles,
  Activity,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { mockCampaigns, mockEmployees } from '../../data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const totalEmployees = mockEmployees.length * 120; // Simulated active scale
  const consentedEmployees = Math.round(totalEmployees * 0.94);
  const pendingApprovalsCount = mockCampaigns.filter(
    (c) => c.status === 'Pending Approval'
  ).length;

  // Chart data
  const weeklyData = [
    { day: 'Mon', sent: 120, delivered: 118, failed: 2 },
    { day: 'Tue', sent: 240, delivered: 232, failed: 8 },
    { day: 'Wed', sent: 180, delivered: 176, failed: 4 },
    { day: 'Thu', sent: 310, delivered: 301, failed: 9 },
    { day: 'Fri', sent: 156, delivered: 151, failed: 5 },
    { day: 'Sat', sent: 80, delivered: 79, failed: 1 },
    { day: 'Sun', sent: 45, delivered: 45, failed: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hospital Communication Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            <strong className="text-slate-700 font-semibold">APH Connect:</strong> One Platform. Every Employee. Connected. Operational broadcast metrics for MAPIMS / Adhiparasakthi Hospitals.
          </p>
        </div>

        {/* Date Selector & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#243B67]/20 transition-all cursor-pointer"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
            </select>
          </div>

          {hasPermission('create_campaign') && (
            <button
              onClick={() => navigate('/campaigns/create')}
              className="flex items-center gap-2 px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-200 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Action banner for pending approvals if any */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/90 via-white to-amber-50/60 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-[#7B2846] text-white rounded-xl shrink-0 shadow-xs ring-2 ring-[#7B2846]/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {pendingApprovalsCount} Campaign Pending Four-Eyes Review
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7B2846]/10 text-[#7B2846] border border-[#7B2846]/20 uppercase tracking-wider">
                  {hasPermission('approve_campaign') ? 'Action Required' : 'Under Clinical Review'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                "NABH 5th Edition Mock Audit Readiness Notice" requires authorized clinical approver sign-off before dispatch.
              </p>
            </div>
          </div>
          {hasPermission('approve_campaign') ? (
            <Link
              to="/campaigns/approvals"
              className="px-4 py-2 bg-[#7B2846] hover:bg-[#621f37] text-white text-xs font-bold rounded-xl shrink-0 shadow-xs hover:shadow-md transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Review Approval Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/campaigns/history"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl shrink-0 transition-all inline-flex items-center gap-1.5 self-start sm:self-auto border border-slate-200"
            >
              <span>View Campaign Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* 3 Essential KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Active Hospital Staff"
          value={totalEmployees.toLocaleString()}
          subtitle={`${consentedEmployees.toLocaleString()} eligible for WhatsApp alerts`}
          icon={Users}
          trend={{ value: '94.2%', isPositive: true, label: 'consented' }}
          accentColor="primary"
        />
        <StatCard
          title="Messages Delivered"
          value="4,812"
          subtitle="97.4% delivery success rate"
          icon={CheckCheck}
          trend={{ value: '97.4%', isPositive: true, label: 'success' }}
          accentColor="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          subtitle="Awaiting clinical sign-off"
          icon={Clock}
          trend={pendingApprovalsCount > 0 ? { value: `${pendingApprovalsCount} urgent`, isPositive: false } : undefined}
          accentColor="secondary"
        />
      </div>

      {/* Broadcast Volume & Delivery Chart Alone */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Broadcast Volume & Delivery
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily WhatsApp transmission volume & delivery outcome
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>97.4% Avg Success Rate</span>
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="sent" fill="#243B67" radius={[4, 4, 0, 0]} name="Submitted" />
              <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} name="Delivered" />
              <Bar dataKey="failed" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clean chart legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#243B67]" />
            <span className="font-medium">Submitted ({weeklyData.reduce((a, b) => a + b.sent, 0)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#10B981]" />
            <span className="font-medium">Delivered ({weeklyData.reduce((a, b) => a + b.delivered, 0)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#F43F5E]" />
            <span className="font-medium">Failed ({weeklyData.reduce((a, b) => a + b.failed, 0)})</span>
          </div>
        </div>
      </div>

      {/* Recent Hospital Broadcasts (Clean Full-Width Table) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Hospital Broadcasts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff duty rosters, emergency announcements, and clinical notices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>WATI Gateway Online</span>
            </span>
            <Link
              to="/campaigns/history"
              className="text-xs font-bold text-[#243B67] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View All History</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Target Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recipients</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mockCampaigns.slice(0, 4).map((cmp) => (
                <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">{cmp.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {cmp.campaignId} • {cmp.createdAt}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="truncate block max-w-xs text-slate-600 font-medium" title={cmp.categoryScope}>
                      {cmp.categoryScope}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={cmp.status} />
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">
                    {cmp.selectedRecipientsCount} staff
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to="/campaigns/history"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#243B67] hover:text-white text-[#243B67] rounded-lg font-bold transition-all inline-block shadow-2xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
