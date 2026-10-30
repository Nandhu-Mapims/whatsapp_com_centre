import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useToast } from '../../context/ToastContext';

export const CampaignAnalyticsPage: React.FC = () => {
  const { success } = useToast();
  const [dateRange, setDateRange] = useState('Last 30 Days');

  // Analytics data by Department
  const departmentPerformanceData = [
    { department: 'Emergency & Trauma', delivered: 98.2, read: 92.1 },
    { department: 'ICU & Critical Care', delivered: 97.8, read: 90.4 },
    { department: 'Cardiology', delivered: 99.1, read: 88.5 },
    { department: 'OBG & Maternity', delivered: 96.4, read: 85.2 },
    { department: 'Radiology & Imaging', delivered: 98.5, read: 89.0 },
    { department: 'Pharmacy & Dispensing', delivered: 97.2, read: 82.3 },
    { department: 'Infection Control', delivered: 95.8, read: 79.4 },
  ];

  // Daily message delivery trend
  const trendData = [
    { date: 'Oct 24', sent: 180, read: 165 },
    { date: 'Oct 25', sent: 220, read: 204 },
    { date: 'Oct 26', sent: 140, read: 130 },
    { date: 'Oct 27', sent: 310, read: 288 },
    { date: 'Oct 28', sent: 260, read: 242 },
    { date: 'Oct 29', sent: 390, read: 362 },
    { date: 'Oct 30', sent: 156, read: 145 },
  ];

  const templateUsageData = [
    { name: 'Duty Roster Notices', value: 48, color: '#243B67' },
    { name: 'Clinical CMEs & Academics', value: 24, color: '#60A5FA' },
    { name: 'Accreditation / Mock Audits', value: 16, color: '#7B2846' },
    { name: 'Administrative Advisories', value: 12, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Communication Analytics"
        description="Delivery benchmarks, department acknowledgment ratios, and template performance across all hospital operational units."
      >
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#243B67]"
        >
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Quarter</option>
          <option>Year to Date (2026)</option>
        </select>
        <button
          onClick={() => success('Export Queued', 'Downloading analytics summary dataset.')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Analytics</span>
        </button>
      </PageHeader>

      {/* High-level KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Delivery Rate"
          value="97.4%"
          subtitle="Delivered / confirmed submitted"
          icon={CheckCheck}
          trend={{ value: '1.2%', isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          title="Avg Read Rate"
          value="89.1%"
          subtitle="Read / successfully delivered"
          icon={TrendingUp}
          trend={{ value: '3.4%', isPositive: true }}
          accentColor="blue"
        />
        <StatCard
          title="Opt-Out Suppression"
          value="0.8%"
          subtitle="Protected from broadcast"
          icon={Users}
          accentColor="primary"
        />
        <StatCard
          title="Avg Acknowledgment Time"
          value="4.2 mins"
          subtitle="Emergency shift announcements"
          icon={Calendar}
          accentColor="secondary"
        />
      </div>

      {/* Department Delivery & Read Benchmark Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Department-Wise Delivery & Read Performance (%)
            </h3>
            <p className="text-xs text-slate-500">
              Comparing communication reception and engagement across hospital wings
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 bg-[#243B67] rounded-xs" /> Delivery Rate (%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 bg-[#60A5FA] rounded-xs" /> Read Rate (%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentPerformanceData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="delivered" fill="#243B67" radius={[4, 4, 0, 0]} name="Delivery Rate %" />
              <Bar dataKey="read" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Read Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Daily Volume Trend + Template Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Message Transit Trend</h3>
              <p className="text-xs text-slate-500">Dispatches vs verified reads over the last 7 days</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="#243B67"
                  strokeWidth={2.5}
                  name="Sent"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="read"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  name="Read"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Template Category Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Template Usage Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of communications by template type</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={templateUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {templateUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {templateUsageData.map((d) => (
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
    </div>
  );
};
