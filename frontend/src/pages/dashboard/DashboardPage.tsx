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
  ArrowRight,
  TrendingUp,
  FileCheck,
  Radio,
  ExternalLink,
  Calendar,
  Building2,
  Activity,
  BarChart3,
  ShieldCheck,
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

  const totalEmployees = mockEmployees.length;
  const consentedEmployees = mockEmployees.filter((e) => e.consentStatus === 'Opted-In').length;
  const pendingApprovalsCount = mockCampaigns.filter(
    (c) => c.status === 'Pending Approval'
  ).length;

  // Broadcast volume telemetry
  const weeklyData = [
    { day: 'Mon', sent: 120, delivered: 118, failed: 2 },
    { day: 'Tue', sent: 240, delivered: 232, failed: 8 },
    { day: 'Wed', sent: 180, delivered: 176, failed: 4 },
    { day: 'Thu', sent: 310, delivered: 301, failed: 9 },
    { day: 'Fri', sent: 156, delivered: 151, failed: 5 },
    { day: 'Sat', sent: 80, delivered: 79, failed: 1 },
    { day: 'Sun', sent: 45, delivered: 45, failed: 0 },
  ];

  // Merged from Analytics: Department Delivery & Read Benchmark (%)
  const departmentPerformanceData = [
    { department: 'Emergency', delivered: 98.2, read: 92.1 },
    { department: 'ICU Care', delivered: 97.8, read: 90.4 },
    { department: 'Cardiology', delivered: 99.1, read: 88.5 },
    { department: 'OBG / Mat.', delivered: 96.4, read: 85.2 },
    { department: 'Radiology', delivered: 98.5, read: 89.0 },
    { department: 'Pharmacy', delivered: 97.2, read: 82.3 },
    { department: 'Infection Ctrl', delivered: 95.8, read: 79.4 },
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
            <strong className="text-slate-700 font-semibold">APH Connect:</strong> One Platform. Every Employee. Connected. Operational broadcasts & department telemetry for MAPIMS / Adhiparasakthi Hospitals.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all cursor-pointer"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Merged KPI Grid: Staff Coverage, Delivery Success, Read Engagement & Acknowledgment Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Hospital Staff"
          value={totalEmployees.toLocaleString()}
          subtitle={`${consentedEmployees.toLocaleString()} eligible for WhatsApp`}
          icon={Users}
          trend={{ value: '94.2%', isPositive: true, label: 'opted-in' }}
          accentColor="primary"
        />
        <StatCard
          title="Delivery Success Rate"
          value="97.4%"
          subtitle="4,812 / 4,940 submitted messages"
          icon={CheckCheck}
          trend={{ value: '1.2%', isPositive: true, label: 'benchmark' }}
          accentColor="emerald"
        />
        <StatCard
          title="Avg Staff Read Rate"
          value="89.1%"
          subtitle="Confirmed double blue ticks"
          icon={TrendingUp}
          trend={{ value: '3.4%', isPositive: true, label: 'engagement' }}
          accentColor="blue"
        />
        <StatCard
          title="Avg Acknowledgment Time"
          value="4.2 mins"
          subtitle="Emergency shift notices"
          icon={Clock}
          trend={{ value: 'Rapid', isPositive: true, label: 'response' }}
          accentColor="secondary"
        />
      </div>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Broadcast Volume & Delivery Outcome */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Broadcast Volume & Delivery</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily WhatsApp transmission volume & delivery outcome
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 self-start sm:self-auto shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>97.4% Success</span>
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
                  <Bar dataKey="sent" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Submitted" />
                  <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} name="Delivered" />
                  <Bar dataKey="failed" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clean chart legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1E3A8A]" />
              <span className="font-medium">Submitted ({weeklyData.reduce((a, b) => a + b.sent, 0)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
              <span className="font-medium">Delivered ({weeklyData.reduce((a, b) => a + b.delivered, 0)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]" />
              <span className="font-medium">Failed ({weeklyData.reduce((a, b) => a + b.failed, 0)})</span>
            </div>
          </div>
        </div>

        {/* Right Chart: Department Performance (Merged from Analytics) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#059669]" />
                  <span>Department Performance (%)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delivery vs. Read engagement across hospital wings
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-xs" /> Delivered %
                </span>
                <span className="flex items-center gap-1 text-[#0284c7] font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded-xs" /> Read %
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentPerformanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="department"
                    stroke="#94a3b8"
                    fontSize={10}
                    angle={-15}
                    textAnchor="end"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: any) => [`${val}%`, '']}
                  />
                  <Bar dataKey="delivered" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Delivered %" />
                  <Bar dataKey="read" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Read %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Highest Read Cadre: <strong className="text-slate-800 font-bold">Emergency & Trauma (92.1%)</strong></span>
            <Link to="/reports/delivery" className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1">
              <span>View Recipient Telemetry</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
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
              className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1 transition-colors"
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
                      to={`/reports/delivery?campaignId=${cmp.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-[#1E3A8A] rounded-lg font-bold transition-all inline-block shadow-2xs"
                    >
                      Report
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
