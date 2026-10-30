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
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockCampaigns, mockEmployees } from '../../data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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

  const deliveryPieData = [
    { name: 'Delivered & Read', value: 78, color: '#243B67' },
    { name: 'Delivered (Unread)', value: 16, color: '#60A5FA' },
    { name: 'Failed / Bounced', value: 4, color: '#F43F5E' },
    { name: 'Opted-Out Suppressed', value: 2, color: '#94A3B8' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hospital Communication Dashboard"
        description="Operational overview of WhatsApp broadcasts, staff roster alerts, and delivery performance for MAPIMS / Adhiparasakthi Hospitals."
      >
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#243B67]"
          >
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
          <button
            onClick={() => navigate('/campaigns/create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </PageHeader>

      {/* Action banner for pending approvals if any */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-[#7B2846]/10 to-amber-500/10 border border-[#7B2846]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7B2846] text-white rounded-lg shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {pendingApprovalsCount} Campaign Pending Four-Eyes Review
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                "NABH 5th Edition Mock Audit Readiness Notice" requires authorized clinical approver sign-off before dispatch.
              </p>
            </div>
          </div>
          <Link
            to="/campaigns/approvals"
            className="px-3.5 py-1.5 bg-[#7B2846] hover:bg-[#621f37] text-white text-xs font-semibold rounded-lg shrink-0 transition-colors inline-flex items-center gap-1"
          >
            Review Approval Queue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Active Employees"
          value={totalEmployees.toLocaleString()}
          subtitle="All hospital units"
          icon={Users}
          trend={{ value: '3.4%', isPositive: true, label: 'vs last mo' }}
          accentColor="primary"
        />
        <StatCard
          title="Consented Staff"
          value={consentedEmployees.toLocaleString()}
          subtitle="94.2% eligible for broadcast"
          icon={CheckCircle}
          trend={{ value: '94.2%', isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          title="Campaigns Sent"
          value="42"
          subtitle="This month"
          icon={Send}
          trend={{ value: '+8', isPositive: true }}
          accentColor="blue"
        />
        <StatCard
          title="Messages Delivered"
          value="4,812"
          subtitle="97.4% delivery rate"
          icon={CheckCheck}
          trend={{ value: '97.4%', isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          title="Failed / Blocked"
          value="24"
          subtitle="Suppressed or timeout"
          icon={AlertOctagon}
          trend={{ value: '0.5%', isPositive: false }}
          accentColor="rose"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          subtitle="Action required"
          icon={Clock}
          accentColor="secondary"
        />
      </div>

      {/* Charts Section: Volume & Delivery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Message Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Broadcast Volume & Delivery</h3>
              <p className="text-xs text-slate-500">Messages sent vs successfully confirmed delivered</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 97.4% Avg Success
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sent" fill="#243B67" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} name="Delivered" />
                <Bar dataKey="failed" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Ratio Donut */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery Status Breakdown</h3>
            <p className="text-xs text-slate-500">Recipient outcome distribution</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliveryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deliveryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {deliveryPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Campaigns Table + Quick Operations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns Table */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Hospital Campaigns</h3>
              <p className="text-xs text-slate-500">Rosters, emergency alerts, and circulars</p>
            </div>
            <Link
              to="/campaigns/history"
              className="text-xs font-semibold text-[#243B67] hover:underline flex items-center gap-1"
            >
              View All History <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Target Scope</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Recipients</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mockCampaigns.slice(0, 4).map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{cmp.title}</div>
                      <div className="text-[11px] text-slate-400">{cmp.campaignId} • {cmp.createdAt}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="truncate block max-w-[160px] text-slate-600" title={cmp.categoryScope}>
                        {cmp.categoryScope}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={cmp.status} />
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {cmp.selectedRecipientsCount} staff
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/campaigns/history"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#243B67] rounded-md font-semibold transition-colors"
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

        {/* Quick Operations & System Health Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            <p className="text-xs text-slate-500 mb-3">Frequently used operational workflows</p>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/campaigns/create')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#243B67]" />
                  Launch New Campaign
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/employees/import')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Bulk Import Employees (.xlsx)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/templates/designer')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-left flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#7B2846]" />
                  Draft WhatsApp Template
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Integration Status Quick Widget */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                WATI Gateway Health
              </span>
              <span className="text-emerald-700 font-bold">Online</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Webhook sync active • Meta Business API v21.0
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2">
              <span>Daily Quota: 1,420 / 10,000</span>
              <Link to="/admin/wati" className="text-[#243B67] font-semibold hover:underline">
                Configure
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
