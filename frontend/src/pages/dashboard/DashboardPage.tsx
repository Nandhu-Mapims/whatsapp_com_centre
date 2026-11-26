import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCheck,
  ArrowRight,
  TrendingUp,
  Radio,
  ExternalLink,
  Calendar,
  Building2,
  Activity,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Employee, Campaign } from '../../types';

interface LiveDeliveryLog {
  id: string;
  campaignId: string;
  campaignName: string;
  employeeId: string;
  employeeName: string;
  maskedNumber: string;
  rawNumber?: string;
  templateName: string;
  submittedAt: string;
  providerStatus: 'sent' | 'delivered' | 'read' | 'failed';
  statusTimestamp: string;
}

interface DeliverySummary {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  sentRate: number;
  deliveryRate: number;
  readRate: number;
}

export const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'All Time'>('Last 30 Days');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<LiveDeliveryLog[]>([]);
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummary | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [systemMode, setSystemMode] = useState<{ isTestMode: boolean; mode: string } | null>(null);
  const [repliesStats, setRepliesStats] = useState<{ totalReplies: number; newRepliesCount: number }>({
    totalReplies: 0,
    newRepliesCount: 0,
  });

  const loadDashboardTelemetry = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };

    try {
      const [empRes, cmpRes, repRes, gwRes, modeRes, repliesRes] = await Promise.allSettled([
        fetch('/api/employees', { headers }).then((r) => r.json()),
        fetch('/api/campaigns', { headers }).then((r) => r.json()),
        fetch('/api/reports/delivery', { headers }).then((r) => r.json()),
        fetch('/api/gateway/status').then((r) => r.json()),
        fetch('/api/system/mode').then((r) => r.json()),
        fetch('/api/vaati/replies', { headers }).then((r) => r.json()),
      ]);

      if (empRes.status === 'fulfilled' && empRes.value?.success && Array.isArray(empRes.value.data)) {
        setEmployees(empRes.value.data);
      }
      if (cmpRes.status === 'fulfilled' && cmpRes.value?.success && Array.isArray(cmpRes.value.data)) {
        setCampaigns(cmpRes.value.data);
      }
      if (repRes.status === 'fulfilled' && repRes.value?.success) {
        if (Array.isArray(repRes.value.data)) setDeliveryLogs(repRes.value.data);
        if (repRes.value.summary) setDeliverySummary(repRes.value.summary);
      }
      if (gwRes.status === 'fulfilled' && gwRes.value?.success) {
        setGatewayStatus(gwRes.value.data);
      }
      if (modeRes.status === 'fulfilled' && modeRes.value?.success) {
        setSystemMode({ isTestMode: Boolean(modeRes.value.isTestMode), mode: modeRes.value.mode });
      }
      if (repliesRes.status === 'fulfilled' && repliesRes.value?.success) {
        setRepliesStats({
          totalReplies: repliesRes.value.totalReplies || 0,
          newRepliesCount: repliesRes.value.newRepliesCount || 0,
        });
      }
    } catch (err) {
      console.error('[Dashboard] Failed loading telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardTelemetry(false);
  }, [loadDashboardTelemetry]);

  // Cutoff date based on dateRange filter
  const cutoffDateStr = useMemo(() => {
    if (dateRange === 'All Time') return '';
    const d = new Date();
    const days = dateRange === 'Today' ? 0 : dateRange === 'Last 7 Days' ? 6 : 29;
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }, [dateRange]);

  const filteredLogs = useMemo(() => {
    if (!cutoffDateStr) return deliveryLogs;
    return deliveryLogs.filter((l) => {
      const datePart = (l.submittedAt || '').slice(0, 10);
      return !datePart || datePart >= cutoffDateStr;
    });
  }, [deliveryLogs, cutoffDateStr]);

  const filteredCampaigns = useMemo(() => {
    if (!cutoffDateStr) return campaigns;
    return campaigns.filter((c) => {
      const datePart = (c.createdAt || '').slice(0, 10);
      return !datePart || datePart >= cutoffDateStr;
    });
  }, [campaigns, cutoffDateStr]);

  // Live Staff KPIs
  const totalEmployees = employees.length;
  const consentedEmployees = useMemo(
    () => employees.filter((e) => e.consentStatus !== 'Opted-Out').length,
    [employees]
  );
  const optedInPct = totalEmployees > 0 ? ((consentedEmployees / totalEmployees) * 100).toFixed(1) : '0.0';

  // Live Delivery KPIs derived from filteredLogs (falling back to full summary if all-time)
  const deliveryStats = useMemo(() => {
    const total = filteredLogs.length;
    if (total === 0 && dateRange === 'All Time' && deliverySummary) {
      return deliverySummary;
    }
    const sent = filteredLogs.filter((m) => m.providerStatus === 'sent').length;
    const delivered = filteredLogs.filter(
      (m) => m.providerStatus === 'delivered' || m.providerStatus === 'read'
    ).length;
    const read = filteredLogs.filter((m) => m.providerStatus === 'read').length;
    const failed = filteredLogs.filter((m) => m.providerStatus === 'failed').length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
    return {
      total,
      sent,
      delivered,
      read,
      failed,
      sentRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      deliveryRate,
      readRate,
    };
  }, [filteredLogs, dateRange, deliverySummary]);

  // Left Chart: Daily Broadcast Volume & Delivery Outcome from live deliveryLogs
  const dailyChartData = useMemo(() => {
    const byDay = new Map<string, { rawDate: string; day: string; sent: number; delivered: number; failed: number }>();

    filteredLogs.forEach((log) => {
      const dateKey = (log.submittedAt || '').slice(0, 10) || 'Unknown';
      const label =
        dateKey !== 'Unknown'
          ? new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Unknown';

      const bucket = byDay.get(dateKey) || { rawDate: dateKey, day: label, sent: 0, delivered: 0, failed: 0 };
      bucket.sent += 1;
      if (log.providerStatus === 'delivered' || log.providerStatus === 'read') {
        bucket.delivered += 1;
      } else if (log.providerStatus === 'failed') {
        bucket.failed += 1;
      }
      byDay.set(dateKey, bucket);
    });

    return Array.from(byDay.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredLogs]);

  // Right Chart: Top Hospital Departments by Active Staff & WhatsApp Opt-In Readiness (from live /api/employees)
  const departmentReadinessData = useMemo(() => {
    const map = new Map<string, { fullName: string; department: string; total: number; optedIn: number }>();
    employees.forEach((emp) => {
      const dept = (emp.department || 'General').trim();
      const shortLabel = dept.length > 14 ? `${dept.slice(0, 12)}..` : dept;
      const entry = map.get(dept) || { fullName: dept, department: shortLabel, total: 0, optedIn: 0 };
      entry.total += 1;
      if (emp.consentStatus !== 'Opted-Out') {
        entry.optedIn += 1;
      }
      map.set(dept, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [employees]);

  const topDepartment = departmentReadinessData[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hospital Communication Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Data Connected
            </span>
            {systemMode && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  systemMode.isTestMode
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{systemMode.isTestMode ? 'Sandbox Test Mode' : 'Live Production Mode'}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            <strong className="text-slate-700 font-semibold">APH Connect:</strong> Real-time staff directory, WhatsApp gateway health, campaign broadcasts & delivery telemetry for MAPIMS Hospitals.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardTelemetry(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1E3A8A]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Grid (100% Live from Backend APIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Hospital Staff"
          value={isLoading ? '...' : totalEmployees.toLocaleString()}
          subtitle={`${consentedEmployees.toLocaleString()} eligible for WhatsApp`}
          icon={Users}
          trend={{ value: `${optedInPct}%`, isPositive: true, label: 'opted-in' }}
          accentColor="primary"
        />
        <StatCard
          title="Delivery Success Rate"
          value={isLoading ? '...' : `${deliveryStats.deliveryRate}%`}
          subtitle={`${deliveryStats.delivered} / ${deliveryStats.total} tracked messages`}
          icon={CheckCheck}
          trend={{
            value: `${deliveryStats.failed} failed`,
            isPositive: deliveryStats.failed === 0,
            label: dateRange,
          }}
          accentColor="emerald"
        />
        <StatCard
          title="Live Staff Read Rate"
          value={isLoading ? '...' : `${deliveryStats.readRate}%`}
          subtitle={`${deliveryStats.read} confirmed double blue ticks`}
          icon={TrendingUp}
          trend={{
            value: `${deliveryStats.delivered}`,
            isPositive: true,
            label: 'delivered',
          }}
          accentColor="blue"
        />
        <StatCard
          title="Broadcasts & Replies"
          value={isLoading ? '...' : `${campaigns.length}`}
          subtitle={`${repliesStats.totalReplies} user replies in DB (${repliesStats.newRepliesCount} new)`}
          icon={MessageSquare}
          trend={{
            value: gatewayStatus?.activeGateway || 'WATI',
            isPositive: true,
            label: 'active gateway',
          }}
          accentColor="secondary"
        />
      </div>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart: Live Daily Broadcast Volume & Delivery Outcome */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Broadcast Volume & Delivery</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily WhatsApp transmission outcome ({dateRange})
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 self-start sm:self-auto shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>{deliveryStats.deliveryRate}% Delivered</span>
              </span>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="h-64 sm:h-72 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No tracked delivery events found in {dateRange}.
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1E3A8A]" />
              <span className="font-medium">Submitted ({deliveryStats.total})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
              <span className="font-medium">Delivered ({deliveryStats.delivered})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]" />
              <span className="font-medium">Failed ({deliveryStats.failed})</span>
            </div>
          </div>
        </div>

        {/* Right Chart: Top Hospital Departments (Live Staff & Opt-In Readiness) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#059669]" />
                  <span>Top Hospital Departments</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live staff count vs. WhatsApp opted-in eligibility
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-xs" /> Total Staff
                </span>
                <span className="flex items-center gap-1 text-[#059669] font-semibold">
                  <span className="w-2.5 h-2.5 bg-[#10B981] rounded-xs" /> Opted-In
                </span>
              </div>
            </div>

            {departmentReadinessData.length === 0 ? (
              <div className="h-64 sm:h-72 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Loading department breakdown...
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentReadinessData}
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
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
                    />
                    <Bar dataKey="total" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Total Staff" />
                    <Bar dataKey="optedIn" fill="#10B981" radius={[4, 4, 0, 0]} name="Opted-In" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Largest Wing:{' '}
              <strong className="text-slate-800 font-bold">
                {topDepartment ? `${topDepartment.fullName} (${topDepartment.total} Staff)` : '—'}
              </strong>
            </span>
            <Link to="/reports/delivery" className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1">
              <span>View Recipient Telemetry</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Hospital Broadcasts (Live from /api/campaigns) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Hospital Broadcasts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live campaigns created & dispatched ({filteredCampaigns.length} in {dateRange})
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {gatewayStatus?.isVaatiEnabled && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Zap className="w-3 h-3 text-[#C76323]" />
                <span>
                  VAATI: {gatewayStatus?.vaati?.online ? `Online (${gatewayStatus.vaati.session})` : 'Offline'}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>WATI {gatewayStatus?.wati?.status || 'Online'}</span>
            </span>
            <Link
              to="/campaigns/history"
              className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1 transition-colors ml-1"
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
                <th className="py-3 px-3">Gateway</th>
                <th className="py-3 px-3">Target Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recipients</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No campaigns found for {dateRange}.{' '}
                    <Link to="/campaigns/create" className="text-[#1E3A8A] font-bold hover:underline">
                      Create a Broadcast
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.slice(0, 6).map((cmp: any) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{cmp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cmp.campaignId} • {cmp.createdAt}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cmp.gateway === 'VAATI'
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-blue-50 text-[#1E3A8A] border-blue-200'
                        }`}
                      >
                        {cmp.gateway || 'WATI'}
                      </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
