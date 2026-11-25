import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Bot,
  ShieldCheck,
  BarChart3,
  Users,
  Compass,
  MapPin,
  Clock,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useToast } from '../../context/ToastContext';
import { Shortlink, ShortlinkAnalytics } from '../../types';
import { shortlinkService } from '../../services/shortlinkService';

const COLORS = ['#1E3A8A', '#059669', '#D97706', '#64748B', '#8B5CF6'];

export const ShortlinkAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [link, setLink] = useState<Shortlink | null>(null);
  const [analytics, setAnalytics] = useState<ShortlinkAnalytics | null>(null);
  const [range, setRange] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await shortlinkService.getAnalytics(id, range);
      if (res.success) {
        setLink(res.link);
        setAnalytics(res.analytics);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load link analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, range]);

  const handleCopy = () => {
    if (!link) return;
    const url = link.shortUrl || `${window.location.origin}/shortlinks/${link.alias}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Shortlink copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !link) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#1E3A8A] animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Generating link analytics telemetry...</p>
      </div>
    );
  }

  if (!link || !analytics) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Shortlink Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested link ID or alias could not be located in our system.
        </p>
        <Link
          to="/admin/shortlinks"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Shortlinks
        </Link>
      </div>
    );
  }

  const deviceData = analytics.deviceBreakdown.map((d, index) => ({
    name: d.device,
    value: d.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/shortlinks"
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50 transition-colors shadow-2xs"
            title="Back to Shortlinks"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Shortlink Telemetry & Analytics
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {link.campaignChannel || 'General'}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {link.title}
            </h1>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs text-xs font-semibold">
            {[
              { label: '24 Hours', val: '24h' },
              { label: '7 Days', val: '7d' },
              { label: '30 Days', val: '30d' },
              { label: 'All Time', val: 'all' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => setRange(item.val)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  range === item.val
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Refresh analytics data"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Details Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#172554] rounded-2xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-300 bg-white/10 px-3 py-1 rounded-lg border border-white/15">
                /shortlinks/{link.alias}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Short URL'}</span>
              </button>
              <a
                href={link.shortUrl || `${window.location.origin}/shortlinks/${link.alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white text-xs transition-colors"
              >
                <span>Visit Redirect</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400 font-semibold">Points to:</span>
              <a
                href={link.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-300 hover:underline truncate max-w-lg block"
              >
                {link.destinationUrl}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs lg:border-l lg:border-white/15 lg:pl-6 shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created By</div>
              <div className="font-semibold text-white mt-0.5">{link.createdBy || 'Super Admin'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date Created</div>
              <div className="font-semibold text-white mt-0.5">{link.createdAtIst?.split(',')[0]}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expiry Policy</div>
              <div className="font-semibold text-amber-300 mt-0.5">{link.expiresAtIst || 'No Expiry'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Opens Tracked"
          value={analytics.totalOpens.toLocaleString()}
          subtitle="All visits within selected period"
          icon={BarChart3}
          accentColor="primary"
        />
        <StatCard
          title="Likely Human Opens"
          value={analytics.humanOpens.toLocaleString()}
          subtitle={`~${analytics.humanPercentage}% human verification rate`}
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Automated Requests"
          value={analytics.botOpens.toLocaleString()}
          subtitle={`${analytics.previewOpens} previews • ${analytics.crawlerOpens} crawlers`}
          icon={Bot}
          accentColor="amber"
        />
        <StatCard
          title="Last Opened"
          value={analytics.lastOpenedAtIst ? analytics.lastOpenedAtIst.split(',')[1] || analytics.lastOpenedAtIst : 'Never'}
          subtitle={analytics.lastOpenedAtIst ? analytics.lastOpenedAtIst.split(',')[0] : 'No activity yet'}
          icon={Clock}
          accentColor="blue"
        />
      </div>

      {/* CHARTS ROW: Opens Over Time & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opens Over Time Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Opens Over Time (Asia/Kolkata IST)
              </h3>
              <p className="text-[11px] text-slate-500">
                Timeline trend distinguishing verified human clicks from automated link previews
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span> Human Opens
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Automated
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics.opensOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.opensOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="humanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="autoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="human"
                    name="Human Opens"
                    stroke="#1E3A8A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#humanGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="automated"
                    name="Automated / Bot"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#autoGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No activity recorded during this time period
              </div>
            )}
          </div>
        </div>

        {/* Device Breakdown (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Device Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Recipient hardware devices and crawler breakdown
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No device data</p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {analytics.deviceBreakdown.map((dev, idx) => (
              <div key={dev.device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span className="font-medium text-slate-700">{dev.device}</span>
                </div>
                <div className="font-mono text-slate-500">
                  {dev.count} ({dev.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BROWSERS, OS, GEO & REFERRERS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Browsers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#1E3A8A]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Browsers</h4>
          </div>
          <div className="space-y-2">
            {analytics.browserBreakdown.length > 0 ? (
              analytics.browserBreakdown.map((b) => (
                <div key={b.browser} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px]" title={b.browser}>
                    {b.browser}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {b.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No browser data</p>
            )}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Operating Systems</h4>
          </div>
          <div className="space-y-2">
            {analytics.osBreakdown.length > 0 ? (
              analytics.osBreakdown.map((o) => (
                <div key={o.os} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px]" title={o.os}>
                    {o.os}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {o.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No OS data</p>
            )}
          </div>
        </div>

        {/* Approximate Location */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Approximate Geo</h4>
          </div>
          <div className="space-y-2">
            {analytics.geoBreakdown.length > 0 ? (
              analytics.geoBreakdown.slice(0, 5).map((g) => (
                <div key={`${g.city}-${g.region}`} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px]" title={`${g.city}, ${g.region}`}>
                    {g.city}, {g.region}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {g.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No location data</p>
            )}
          </div>
        </div>

        {/* Referrers & Origins */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Traffic Referrers</h4>
          </div>
          <div className="space-y-2">
            {analytics.referrerBreakdown.length > 0 ? (
              analytics.referrerBreakdown.slice(0, 5).map((r) => (
                <div key={r.referrer} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px]" title={r.referrer}>
                    {r.referrer}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {r.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No referrer data</p>
            )}
          </div>
        </div>
      </div>

      {/* RECENT OPENS STREAM TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Engagement Stream</h3>
            <p className="text-[11px] text-slate-500">
              Live chronological telemetry without retention of raw IP addresses
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">
            Showing latest {analytics.recentActivity.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Device & OS</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Origin / Referrer</th>
                <th className="py-3 px-4">Approx. Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {event.timestampIst}
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {event.isLikelyHuman ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Users className="w-3 h-3 text-emerald-600" />
                          Human Open
                        </span>
                      ) : event.clickType === 'preview' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Share2 className="w-3 h-3 text-blue-600" />
                          Link Preview
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Bot className="w-3 h-3 text-amber-700" />
                          Crawler / Scanner
                        </span>
                      )}
                    </td>

                    {/* Device & OS */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{event.deviceType}</div>
                      <div className="text-[10px] text-slate-400">{event.os}</div>
                    </td>

                    {/* Browser */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {event.browser}
                    </td>

                    {/* Referrer */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={event.referrer}>
                      {event.referrer}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{event.location}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No opens recorded yet for this shortlink.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

