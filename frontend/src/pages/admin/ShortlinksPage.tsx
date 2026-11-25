import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Power,
  BarChart3,
  Globe,
  QrCode,
  MessageSquare,
  Radio,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useToast } from '../../context/ToastContext';
import { Shortlink, ShortlinkStatus } from '../../types';
import { shortlinkService } from '../../services/shortlinkService';

export const ShortlinksPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  const [links, setLinks] = useState<Shortlink[]>([]);
  const [summary, setSummary] = useState({
    totalLinks: 0,
    activeLinks: 0,
    disabledLinks: 0,
    expiredLinks: 0,
    totalOpens: 0,
    humanOpens: 0,
    botOpens: 0,
    humanPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Copy feedback tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDestUrl, setCreateDestUrl] = useState('');
  const [createAlias, setCreateAlias] = useState('');
  const [createChannel, setCreateChannel] = useState('WhatsApp');
  const [createExpiry, setCreateExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success Created Link Modal (for instant copy)
  const [createdLink, setCreatedLink] = useState<Shortlink | null>(null);

  // Edit Modal State
  const [editingLink, setEditingLink] = useState<Shortlink | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDestUrl, setEditDestUrl] = useState('');
  const [editChannel, setEditChannel] = useState('WhatsApp');
  const [editExpiry, setEditExpiry] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Domain for preview
  const currentOrigin = window.location.origin;

  const loadShortlinks = async () => {
    try {
      setLoading(true);
      const res = await shortlinkService.getAll();
      if (res.success) {
        setLinks(res.data);
        setSummary(res.summary);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load shortlinks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShortlinks();
  }, []);

  const handleCopyLink = (link: Shortlink, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const urlToCopy = link.shortUrl || `${currentOrigin}/shortlinks/${link.alias}`;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedId(link.id);
    success(`Shortlink copied to clipboard: /shortlinks/${link.alias}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2200);
  };

  const handleGenerateRandomAlias = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let code = 'aph-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateAlias(code);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      toastError('Please provide a descriptive link title.');
      return;
    }
    if (!createDestUrl.trim()) {
      toastError('Please provide a destination URL.');
      return;
    }
    if (!createDestUrl.startsWith('http://') && !createDestUrl.startsWith('https://')) {
      toastError('Destination URL must start with http:// or https://');
      return;
    }

    try {
      setSubmitting(true);
      const res = await shortlinkService.create({
        title: createTitle.trim(),
        destinationUrl: createDestUrl.trim(),
        customAlias: createAlias.trim() || undefined,
        campaignChannel: createChannel,
        expiresAt: createExpiry ? new Date(createExpiry).toISOString() : null,
      });

      if (res.success) {
        success('Shortlink created successfully!');
        setIsCreateOpen(false);
        setCreatedLink(res.data);
        // Reset form
        setCreateTitle('');
        setCreateDestUrl('');
        setCreateAlias('');
        setCreateChannel('WhatsApp');
        setCreateExpiry('');
        await loadShortlinks();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create shortlink');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (link: Shortlink) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditDestUrl(link.destinationUrl);
    setEditChannel(link.campaignChannel || 'General');
    setEditExpiry(link.expiresAt ? link.expiresAt.slice(0, 16) : '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    if (!editTitle.trim()) {
      toastError('Link title is required.');
      return;
    }
    if (!editDestUrl.trim()) {
      toastError('Destination URL is required.');
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await shortlinkService.update(editingLink.id, {
        title: editTitle.trim(),
        destinationUrl: editDestUrl.trim(),
        campaignChannel: editChannel,
        expiresAt: editExpiry ? new Date(editExpiry).toISOString() : null,
      });

      if (res.success) {
        success(`Shortlink /shortlinks/${editingLink.alias} updated! Destination changed with history preserved.`);
        setEditingLink(null);
        await loadShortlinks();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update shortlink');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (link: Shortlink) => {
    try {
      const res = await shortlinkService.toggleStatus(link.id);
      if (res.success) {
        const newStatus = res.data.computedStatus;
        info(`Shortlink /shortlinks/${link.alias} is now ${newStatus}.`);
        await loadShortlinks();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle status');
    }
  };

  // Filtered links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.destinationUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.campaignChannel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      channelFilter === 'ALL' || link.campaignChannel.toLowerCase() === channelFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'ALL' || link.computedStatus.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const getChannelIcon = (ch?: string) => {
    switch ((ch || '').toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'qr code':
        return <QrCode className="w-3.5 h-3.5 text-blue-600" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-indigo-600" />;
      case 'notice board':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: ShortlinkStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'Disabled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Disabled
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Expired
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Shortlink Creation"
        description="Generate branded short URLs on our hospital domain for WhatsApp announcements, ward QR codes, and website campaigns with real-time engagement telemetry."
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shortlink</span>
        </button>
      </PageHeader>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Shortlinks"
          value={summary.totalLinks}
          subtitle={`${summary.activeLinks} active • ${summary.disabledLinks} disabled`}
          icon={Link2}
          accentColor="primary"
        />
        <StatCard
          title="Active Live Links"
          value={summary.activeLinks}
          subtitle="Redirecting on domain"
          icon={Globe}
          accentColor="emerald"
        />
        <StatCard
          title="Total Opens Tracked"
          value={summary.totalOpens.toLocaleString()}
          subtitle={`${summary.humanOpens.toLocaleString()} human • ${summary.botOpens.toLocaleString()} bots`}
          icon={BarChart3}
          accentColor="blue"
        />
        <StatCard
          title="Likely Human Opens"
          value={`${summary.humanPercentage}%`}
          subtitle={`${summary.humanOpens.toLocaleString()} verified staff clicks`}
          icon={ShieldCheck}
          accentColor="secondary"
        />
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, alias, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="ALL">All Channels</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="QR Code">QR Code</option>
            <option value="Website">Website</option>
            <option value="Notice Board">Notice Board</option>
            <option value="SMS">SMS</option>
            <option value="General">General</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <button
            onClick={loadShortlinks}
            title="Refresh links table"
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Shortlinks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Title & Channel</th>
                <th className="py-3.5 px-4">Short URL</th>
                <th className="py-3.5 px-4">Destination URL</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Total Opens</th>
                <th className="py-3.5 px-4">Last Opened</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link) => {
                  const displayShortUrl = link.shortUrl || `${currentOrigin}/shortlinks/${link.alias}`;
                  const isCopied = copiedId === link.id;

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/shortlinks/${link.id}/analytics`)}
                    >
                      {/* Title & Channel */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">
                          {link.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {getChannelIcon(link.campaignChannel)}
                            {link.campaignChannel}
                          </span>
                          {link.expiresAtIst && link.expiresAtIst !== 'No Expiry' && (
                            <span className="text-[10px] text-slate-400">
                              Exp: {link.expiresAtIst.split(',')[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Short URL with Click-to-Copy */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#1E3A8A] bg-[#1E3A8A]/5 px-2.5 py-1 rounded-md border border-[#1E3A8A]/10">
                            /shortlinks/{link.alias}
                          </span>
                          <button
                            onClick={(e) => handleCopyLink(link, e)}
                            className={`p-1.5 rounded-md border transition-all ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                            }`}
                            title="Copy Short URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={displayShortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100 transition-colors"
                            title="Test public redirect in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Destination URL */}
                      <td className="py-4 px-4 max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-[#1E3A8A] text-xs font-mono truncate block max-w-xs hover:underline"
                          title={link.destinationUrl}
                        >
                          {link.destinationUrl}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(link.computedStatus)}
                      </td>

                      {/* Total Opens */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-sm text-slate-900 font-mono">
                          {link.totalOpens.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {link.humanOpens} human • {link.botOpens} bots
                        </div>
                      </td>

                      {/* Last Opened */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {link.lastOpenedAtIst || 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/shortlinks/${link.id}/analytics`)}
                            className="p-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Link Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(link)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Destination URL & Settings"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(link)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              link.isActive
                                ? 'text-emerald-600 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={link.isActive ? 'Disable Shortlink' : 'Enable Shortlink'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Link2 className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No shortlinks found</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Click "Create Shortlink" to make your first branded link'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SHORTLINK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-[#172554] to-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Create Branded Shortlink</h3>
                  <p className="text-[11px] text-blue-200">Generate trackable redirect on our hospital domain</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Link Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incident Reporting App WhatsApp Announcement"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Destination URL */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://incident.mapims.edu.in/portal"
                  value={createDestUrl}
                  onChange={(e) => setCreateDestUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must be an absolute HTTP or HTTPS URL.</p>
              </div>

              {/* Custom Alias with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Custom Alias <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomAlias}
                    className="text-[11px] text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Alias
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-xs select-none">
                    /shortlinks/
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. test1 (leave blank to auto-generate)"
                    value={createAlias}
                    onChange={(e) => setCreateAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-[11px] text-blue-950 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-blue-900">Live Shortlink URL Preview:</span>
                  <span className="font-mono text-[11px] text-[#1E3A8A] break-all block mt-0.5">
                    {currentOrigin}/shortlinks/{createAlias.trim() || 'test1'}
                  </span>
                </div>
              </div>

              {/* Channel and Expiry Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Campaign or Channel</label>
                  <select
                    value={createChannel}
                    onChange={(e) => setCreateChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="QR Code">QR Code</option>
                    <option value="Website">Website</option>
                    <option value="Notice Board">Notice Board</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    Expiry Date & Time <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={createExpiry}
                    onChange={(e) => setCreateExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Generating Link...' : 'Create Shortlink'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED LINK SUCCESS POPUP */}
      {createdLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Shortlink Ready!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your branded link for <strong className="text-slate-700">{createdLink.title}</strong> is live and ready for dispatch.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#1E3A8A] truncate">
                {createdLink.shortUrl || `${currentOrigin}/shortlinks/${createdLink.alias}`}
              </span>
              <button
                onClick={() => handleCopyLink(createdLink)}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-bold hover:bg-[#172554] flex items-center gap-1 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>

            <button
              onClick={() => setCreatedLink(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* EDIT SHORTLINK MODAL */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Edit Shortlink Details</h3>
                <p className="text-[11px] text-slate-300">
                  Update destination while preserving public short URL: <strong className="text-white">/shortlinks/{editingLink.alias}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Zero Disruption Guarantee:</span>
                  <span className="text-emerald-800 block text-[10px] mt-0.5">
                    The shortlink URL (<code className="font-bold">/shortlinks/{editingLink.alias}</code>) and all historical click metrics remain 100% intact.
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Link Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">New Destination URL</label>
                <input
                  type="url"
                  value={editDestUrl}
                  onChange={(e) => setEditDestUrl(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Campaign Channel</label>
                  <select
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="QR Code">QR Code</option>
                    <option value="Website">Website</option>
                    <option value="Notice Board">Notice Board</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold rounded-xl shadow-xs"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

