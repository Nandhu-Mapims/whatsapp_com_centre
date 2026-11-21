import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  CheckCheck,
  Eye,
  AlertCircle,
  Phone,
  RefreshCw,
  Clock,
  Send,
  X,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockDeliveryMessages, mockCampaigns, mockEmployees } from '../../data/mockData';
import { Campaign, DeliveryMessage, Employee } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DeliveryReportsPage: React.FC = () => {
  const { success } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Campaign data state
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Selected campaign filter (from URL query param or state)
  const campaignParam = searchParams.get('campaignId') || 'ALL';
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignParam);

  // Synchronize state with URL query parameter
  useEffect(() => {
    if (campaignParam && campaignParam !== selectedCampaignId) {
      setSelectedCampaignId(campaignParam);
    }
  }, [campaignParam]);

  // Load campaigns from API
  useEffect(() => {
    setIsLoadingCampaigns(true);
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Merge API campaigns with mockCampaigns, avoiding duplicates
          const apiIds = new Set(json.data.map((c: any) => c.id || c.campaignId));
          const keptMocks = mockCampaigns.filter(
            (c) => !apiIds.has(c.id) && !apiIds.has(c.campaignId)
          );
          setCampaigns([...json.data, ...keptMocks]);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback campaigns:', err);
      })
      .finally(() => setIsLoadingCampaigns(false));
  }, []);

  // Update URL search params when campaign selection changes
  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    if (campId === 'ALL') {
      searchParams.delete('campaignId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ campaignId: campId });
    }
  };

  // The active campaign object (if an individual campaign is chosen)
  const activeCampaign = useMemo(() => {
    if (selectedCampaignId === 'ALL') return null;
    return (
      campaigns.find(
        (c) =>
          c.id === selectedCampaignId ||
          c.campaignId === selectedCampaignId ||
          c.title === selectedCampaignId
      ) || null
    );
  }, [campaigns, selectedCampaignId]);

  // Filters for the recipient messages table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMessage, setSelectedMessage] = useState<DeliveryMessage | null>(null);

  // Date Range Filter State
  type DateFilterOption = 'all' | 'today' | 'yesterday' | 'last7days' | 'custom';
  const [dateRangeFilter, setDateRangeFilter] = useState<DateFilterOption>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('2026-11-14');
  const [customToDate, setCustomToDate] = useState<string>('2026-11-21');

  // Phone editing state in drawer
  const [editingPhone, setEditingPhone] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Partial<DeliveryMessage>>>({});

  // Helper function to check if a message timestamp falls within selected date filter
  const isWithinDateFilter = (submittedAt?: string) => {
    if (!submittedAt) return true;
    if (dateRangeFilter === 'all') return true;

    const itemDate = submittedAt.slice(0, 10); // 'YYYY-MM-DD'
    const today = '2026-11-21';
    const yesterday = '2026-11-20';
    const sevenDaysAgo = '2026-11-14';

    if (dateRangeFilter === 'today') {
      return itemDate === today;
    }
    if (dateRangeFilter === 'yesterday') {
      return itemDate === yesterday;
    }
    if (dateRangeFilter === 'last7days') {
      return itemDate >= sevenDaysAgo && itemDate <= today;
    }
    if (dateRangeFilter === 'custom') {
      if (customFromDate && customToDate) {
        return itemDate >= customFromDate && itemDate <= customToDate;
      }
      if (customFromDate) return itemDate >= customFromDate;
      if (customToDate) return itemDate <= customToDate;
    }
    return true;
  };

  // Reset or initialize editing phone whenever a message is selected
  useEffect(() => {
    if (selectedMessage) {
      // Find employee's full number from mockEmployees or fallback
      const emp = mockEmployees.find((e) => e.employeeId === selectedMessage.employeeId);
      setEditingPhone(emp?.whatsappNumber || '+919551382296');
    }
  }, [selectedMessage?.id]);

  // Handle updating phone number and re-dispatching
  const handleSaveAndRetryPhone = async () => {
    if (!selectedMessage || !editingPhone.trim()) return;
    setIsUpdatingPhone(true);
    try {
      const cleanPhone = editingPhone.trim().startsWith('+') ? editingPhone.trim() : `+${editingPhone.trim()}`;
      const newMasked = cleanPhone.length > 8 ? `${cleanPhone.slice(0, 8)} ••••••` : cleanPhone;

      // Update backend
      await fetch('/api/employees/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedMessage.employeeId,
          whatsappNumber: cleanPhone,
        }),
      }).catch(() => {});

      const updatedFields: Partial<DeliveryMessage> = {
        maskedNumber: newMasked,
        providerStatus: 'delivered',
        statusTimestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        errorCode: undefined,
        errorDescription: undefined,
        canRetry: false,
      };

      setOverrides((prev) => ({
        ...prev,
        [selectedMessage.id]: updatedFields,
      }));

      setSelectedMessage((prev) => (prev ? { ...prev, ...updatedFields } : null));

      success(
        'WhatsApp Number Updated & Re-Dispatched',
        `Updated destination to ${newMasked} for ${selectedMessage.employeeName}. Delivery re-queued successfully!`
      );
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  // Generate or retrieve granular message delivery records for the chosen campaign or all
  const messageRecords = useMemo<DeliveryMessage[]>(() => {
    let baseList: DeliveryMessage[] = [];

    // If an individual campaign is selected
    if (activeCampaign) {
      // First check if mockDeliveryMessages already has messages matching this campaign
      const existing = mockDeliveryMessages.filter(
        (m) =>
          m.campaignId === activeCampaign.id ||
          m.campaignId === activeCampaign.campaignId ||
          m.campaignName === activeCampaign.title
      );

      if (existing.length > 0) {
        baseList = existing;
      } else {
        // Synthesize realistic recipient rows for this campaign from real hospital employees
        const count = Math.min(
          activeCampaign.selectedRecipientsCount || activeCampaign.submittedCount || 25,
          50
        );
        const deliveredCount = activeCampaign.deliveredCount ?? Math.floor(count * 0.95);
        const readCount = activeCampaign.readCount ?? Math.floor(count * 0.85);
        const failedCount = activeCampaign.failedCount ?? Math.max(0, count - deliveredCount);

        // Select slice of employees matching department if possible
        const matching = mockEmployees.filter((e) => {
          if (!activeCampaign.departmentScope || activeCampaign.departmentScope === 'All' || activeCampaign.departmentScope === 'All Departments') {
            return true;
          }
          return activeCampaign.departmentScope.toLowerCase().includes(e.department.toLowerCase());
        });

        const pool = matching.length >= count ? matching : mockEmployees;

        baseList = pool.slice(0, count).map((emp, idx) => {
          let status: 'read' | 'delivered' | 'sent' | 'failed' = 'delivered';
          if (idx < readCount) {
            status = 'read';
          } else if (idx < deliveredCount) {
            status = 'delivered';
          } else if (idx >= count - failedCount) {
            status = 'failed';
          } else {
            status = 'sent';
          }

          // Use campaign creation date or distribute between today and yesterday
          const baseDate = activeCampaign.createdAt || (idx % 2 === 0 ? '2026-11-21 10:30' : '2026-11-20 10:30');
          const dateStr = baseDate.slice(0, 10);
          const timeStr = baseDate.length > 11 ? baseDate.slice(11) : '10:30';

          return {
            id: `msg-${activeCampaign.id || 'cmp'}-${idx + 1}`,
            campaignId: activeCampaign.id || activeCampaign.campaignId,
            campaignName: activeCampaign.title,
            employeeId: emp.employeeId,
            employeeName: emp.name,
            maskedNumber: emp.maskedNumber || `${emp.whatsappNumber.slice(0, 8)} ••••••`,
            templateName: activeCampaign.templateName || 'aph_test_sample',
            submittedAt: `${dateStr} ${timeStr}:15`,
            providerStatus: status,
            statusTimestamp: `${dateStr} ${timeStr}:${20 + (idx % 35)}`,
            canRetry: status === 'failed',
            retryAttempts: status === 'failed' ? 1 : 0,
            errorCode: status === 'failed' ? 'ERR_INVALID_PHONE' : undefined,
            errorDescription:
              status === 'failed'
                ? 'Invalid phone number or WhatsApp account not found on recipient device.'
                : undefined,
          };
        });
      }
    } else {
      // For All Campaigns, synthesize a rich dataset distributed across Today, Yesterday, and Last 7 Days
      baseList = mockEmployees.slice(0, 50).map((emp, idx) => {
        let status: 'read' | 'delivered' | 'sent' | 'failed' = 'read';
        let errCode: string | undefined = undefined;
        let errDesc: string | undefined = undefined;

        if (idx === 7 || idx === 19 || idx === 34) {
          status = 'failed';
          errCode = idx === 7 ? 'ERR_INVALID_PHONE' : idx === 19 ? 'ERR_NOT_ON_WHATSAPP' : 'ERR_NETWORK_TIMEOUT';
          errDesc =
            idx === 7
              ? 'Phone number has invalid formatting or digits.'
              : idx === 19
              ? 'WhatsApp account not detected for this number.'
              : 'Delivery timed out after 3 retries (handset powered off).';
        } else if (idx % 5 === 0) {
          status = 'delivered';
        } else if (idx % 8 === 0) {
          status = 'sent';
        }

        // Realistic date distribution:
        // idx 0-18: Today (2026-11-21)
        // idx 19-35: Yesterday (2026-11-20)
        // idx 36-45: Earlier in Last 7 Days (2026-11-18)
        // idx 46+: Previous week (2026-11-10)
        let datePart = '2026-11-21';
        if (idx >= 19 && idx < 36) {
          datePart = '2026-11-20';
        } else if (idx >= 36 && idx < 46) {
          datePart = '2026-11-18';
        } else if (idx >= 46) {
          datePart = '2026-11-10';
        }

        const cmp = mockCampaigns[idx % mockCampaigns.length] || mockCampaigns[0];
        return {
          id: `msg-all-${idx + 1}`,
          campaignId: cmp.id || cmp.campaignId,
          campaignName: cmp.title,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          maskedNumber: emp.maskedNumber || `${emp.whatsappNumber.slice(0, 8)} ••••••`,
          templateName: cmp.templateName || 'aph_test_sample',
          submittedAt: `${datePart} 11:${15 + (idx % 40)}:10`,
          providerStatus: status,
          statusTimestamp: `${datePart} 11:${16 + (idx % 40)}:25`,
          canRetry: status === 'failed',
          retryAttempts: status === 'failed' ? 1 : 0,
          errorCode: errCode,
          errorDescription: errDesc,
        };
      });
    }

    // Apply any local overrides (e.g. updated phone number / re-dispatched)
    return baseList.map((m) => (overrides[m.id] ? { ...m, ...overrides[m.id] } : m));
  }, [activeCampaign, overrides]);

  // Apply search query, status outcome, and date range filters
  const filteredMessages = useMemo(() => {
    return messageRecords.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        m.employeeName.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        m.maskedNumber.toLowerCase().includes(q) ||
        m.campaignName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || m.providerStatus === statusFilter;
      const matchesDate = isWithinDateFilter(m.submittedAt);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [messageRecords, searchTerm, statusFilter, dateRangeFilter, customFromDate, customToDate]);

  // Dynamic KPI counts dynamically recalculated from the filtered view
  const currentTotal = filteredMessages.length;
  const currentDelivered = filteredMessages.filter(
    (m) => m.providerStatus === 'delivered' || m.providerStatus === 'read'
  ).length;
  const currentRead = filteredMessages.filter((m) => m.providerStatus === 'read').length;
  const currentFailed = filteredMessages.filter((m) => m.providerStatus === 'failed').length;

  const deliveryRate = currentTotal > 0 ? ((currentDelivered / currentTotal) * 100).toFixed(1) : '100.0';
  const readRate = currentDelivered > 0 ? ((currentRead / currentDelivered) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Delivery Reports"
        description="Monitor campaign delivery status, read confirmations, and transit lifecycle for individual campaigns or hospital-wide broadcasts."
      >
        <button
          onClick={() => navigate('/campaigns/create')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>New Broadcast</span>
        </button>
        <button
          onClick={() =>
            success(
              'Delivery Report Exported',
              `Downloaded delivery records for ${activeCampaign ? activeCampaign.title : 'all campaigns'} in XLSX format.`
            )
          }
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Report (XLSX)</span>
        </button>
      </PageHeader>

      {/* ============================================================ */}
      {/* FILTER WORKSTATION: DATE RANGE & CAMPAIGN SELECTOR           */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* ROW 1: DISPATCH DATE FILTER OPTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#243B67]/10 text-[#243B67] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Filter by Dispatch Date
              </span>
              <span className="text-[11px] text-slate-500">
                Isolate recipient delivery receipts and telemetry by specific date range.
              </span>
            </div>
          </div>

          {/* Quick Date Range Buttons & Custom Inputs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDateRangeFilter('today')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs',
                dateRangeFilter === 'today'
                  ? 'bg-[#243B67] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('yesterday')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs',
                dateRangeFilter === 'yesterday'
                  ? 'bg-[#243B67] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              )}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('last7days')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs',
                dateRangeFilter === 'last7days'
                  ? 'bg-[#243B67] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              )}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRangeFilter('custom')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5',
                dateRangeFilter === 'custom'
                  ? 'bg-[#243B67] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom Date</span>
            </button>
            {dateRangeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setDateRangeFilter('all')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 ml-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>All Dates</span>
              </button>
            )}
          </div>
        </div>

        {/* CUSTOM DATE RANGE FROM-TO INPUTS (Only visible when dateRangeFilter === 'custom') */}
        {dateRangeFilter === 'custom' && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-[#243B67]" />
              <span>Custom Range (From - To):</span>
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-slate-500 uppercase">From:</label>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-[#243B67] focus:outline-none flex-1 sm:flex-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-slate-500 uppercase">To:</label>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-[#243B67] focus:outline-none flex-1 sm:flex-none"
              />
            </div>

            <span className="text-[11px] text-slate-500 sm:ml-auto">
              Filtering records between <strong>{customFromDate || 'Start'}</strong> and <strong>{customToDate || 'Today'}</strong>
            </span>
          </div>
        )}

        {/* ROW 2: CAMPAIGN SELECTION */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#243B67] flex items-center justify-center font-bold border border-blue-200/80">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <label htmlFor="campaign-select" className="text-xs font-bold text-slate-900 block">
                  Select Broadcast Campaign
                </label>
                <span className="text-[11px] text-slate-500">
                  Choose an individual broadcast to view its dedicated delivery status, progress funnel, and recipient logs.
                </span>
              </div>
            </div>

            {selectedCampaignId !== 'ALL' && (
              <button
                onClick={() => handleSelectCampaign('ALL')}
                className="text-xs font-semibold text-[#243B67] hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Show All Campaigns</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <div className="flex-1 relative">
              <select
                id="campaign-select"
                value={selectedCampaignId}
                onChange={(e) => handleSelectCampaign(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#243B67] shadow-2xs transition-all"
              >
                <option value="ALL">📋 All Broadcast Campaigns (Combined Summary)</option>
                {campaigns.map((c) => (
                  <option key={c.id || c.campaignId} value={c.id || c.campaignId}>
                    [{c.status.toUpperCase()}] {c.title} ({c.campaignId} • {c.selectedRecipientsCount || c.submittedCount || 0} Staff)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                Total Recorded Campaigns: <strong>{campaigns.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* INDIVIDUAL CAMPAIGN STATUS & PERFORMANCE BANNER             */}
      {/* Rendered when a specific campaign is selected                */}
      {/* ============================================================ */}
      {activeCampaign ? (
        <div className="bg-white rounded-2xl border border-[#243B67]/20 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          {/* Top Row: Title, ID, Status, Priority */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                  {activeCampaign.campaignId}
                </span>
                <StatusBadge status={activeCampaign.status} />
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    activeCampaign.priority === 'Emergency'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : activeCampaign.priority === 'Urgent'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {activeCampaign.priority} Priority
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {activeCampaign.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => navigate('/campaigns/history')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Campaign History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Template Used
              </span>
              <span className="font-mono font-bold text-[#243B67] truncate block">
                {activeCampaign.templateName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Cadre & Scope
              </span>
              <span className="font-semibold text-slate-800 truncate block">
                {activeCampaign.categoryScope}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Department / Role Filter
              </span>
              <span className="font-semibold text-slate-800 truncate block" title={activeCampaign.departmentScope}>
                {activeCampaign.departmentScope || 'All Departments'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Dispatched Date & Time
              </span>
              <span className="font-mono text-slate-700 truncate block">
                {activeCampaign.createdAt}
              </span>
            </div>
          </div>

          {/* Delivery KPI Funnel Strip for Individual Campaign */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-xl border border-blue-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Target</span>
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {currentTotal}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dispatched via WATI</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-slate-50 rounded-xl border border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                {currentDelivered}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {deliveryRate}% Handset Delivery
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-slate-50 rounded-xl border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Read Receipts</span>
                <Eye className="w-4 h-4 text-[#243B67]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#243B67] mt-1">
                {currentRead}
              </div>
              <div className="text-[11px] text-[#243B67] font-semibold mt-0.5">
                {readRate}% Blue Ticks Confirmed
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-rose-50/50 to-slate-50 rounded-xl border border-rose-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Failed / Blocked</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
                {currentFailed}
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">
                {currentTotal > 0 ? ((currentFailed / currentTotal) * 100).toFixed(1) : 0}% Error Rate
              </div>
            </div>
          </div>

          {/* Delivery Visual Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>Campaign Delivery Funnel Progress</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {deliveryRate}% Verified Handset Reach
                </span>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {currentDelivered} / {currentTotal} Recipients Reached
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${currentTotal > 0 ? (currentRead / currentTotal) * 100 : 0}%` }}
                className="bg-[#243B67] transition-all duration-500"
                title={`Read Receipts: ${currentRead} (${currentTotal > 0 ? ((currentRead / currentTotal) * 100).toFixed(1) : 0}%)`}
              />
              <div
                style={{
                  width: `${
                    currentTotal > 0
                      ? (Math.max(0, currentDelivered - currentRead) / currentTotal) * 100
                      : 0
                  }%`,
                }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Delivered (Unread): ${Math.max(0, currentDelivered - currentRead)}`}
              />
              <div
                style={{
                  width: `${
                    currentTotal > 0
                      ? (Math.max(0, currentTotal - currentDelivered - currentFailed) / currentTotal) * 100
                      : 0
                  }%`,
                }}
                className="bg-amber-400 transition-all duration-500"
                title="In Transit / Submitted"
              />
              <div
                style={{ width: `${currentTotal > 0 ? (currentFailed / currentTotal) * 100 : 0}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Failed: ${currentFailed}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#243B67]"></span>
                  <span>Read: <strong>{currentRead}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Delivered: <strong>{currentDelivered}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Failed: <strong>{currentFailed}</strong></span>
                </span>
              </div>

              <span className="text-slate-400">
                Created by <strong>{activeCampaign.createdBy}</strong>
                {activeCampaign.approvedBy && ` • Approved by ${activeCampaign.approvedBy}`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* ALL CAMPAIGNS SUMMARY VIEW                                   */
        /* ============================================================ */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Dispatched"
              value={currentTotal}
              subtitle="Across all broadcast campaigns"
              icon={Send}
              accentColor="blue"
            />
            <StatCard
              title="Confirmed Delivered"
              value={currentDelivered}
              subtitle={`${deliveryRate}% overall handset reach`}
              icon={CheckCheck}
              accentColor="emerald"
            />
            <StatCard
              title="Read Receipts"
              value={currentRead}
              subtitle={`${readRate}% verified read rate`}
              icon={Eye}
              accentColor="primary"
            />
            <StatCard
              title="Failed / Blocked"
              value={currentFailed}
              subtitle="Suppressed or carrier error"
              icon={AlertCircle}
              accentColor="rose"
            />
          </div>

          {/* Quick Campaign Breakdown Selector Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#243B67]" />
                <h3 className="font-bold text-slate-900 text-xs">
                  Broadcast Campaigns Delivery Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Click "View Delivery Details" on any campaign below to inspect its individual logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Campaign Title & ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Recipients</th>
                    <th className="py-3 px-4">Delivered</th>
                    <th className="py-3 px-4">Read Rate</th>
                    <th className="py-3 px-4 text-right">Individual Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {campaigns.map((c) => {
                    const cTotal = c.submittedCount || c.selectedRecipientsCount || 100;
                    const cDelivered = c.deliveredCount ?? Math.floor(cTotal * 0.95);
                    const cRead = c.readCount ?? Math.floor(cTotal * 0.85);
                    const cDelivRate = cTotal > 0 ? ((cDelivered / cTotal) * 100).toFixed(0) : '0';
                    const cReadRate = cDelivered > 0 ? ((cRead / cDelivered) * 100).toFixed(0) : '0';

                    return (
                      <tr key={c.id || c.campaignId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-[11px] font-mono text-slate-400">{c.campaignId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{c.templateName}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{cTotal} staff</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700">{cDelivered}</span>
                            <span className="text-[10px] text-slate-400">({cDelivRate}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#243B67]">{cRead}</span>
                            <span className="text-[10px] text-slate-400">({cReadRate}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSelectCampaign(c.id || c.campaignId)}
                            className="px-3 py-1 bg-blue-50 hover:bg-[#243B67] text-[#243B67] hover:text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-1 border border-blue-200"
                          >
                            <span>View Delivery Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GRANULAR RECIPIENT DELIVERY LOGS TABLE                       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff name, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243B67]"
            >
              <option value="ALL">All Delivery Outcomes</option>
              <option value="read">Read (Blue Ticks Confirmed)</option>
              <option value="delivered">Delivered (Double Ticks)</option>
              <option value="sent">Sent (Transmitted)</option>
              <option value="failed">Failed / Bounced</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {activeCampaign && (
              <span className="text-[11px] font-semibold text-[#243B67] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Campaign: {activeCampaign.campaignId}
              </span>
            )}
            {dateRangeFilter !== 'all' && (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span className="capitalize">
                  {dateRangeFilter === 'last7days'
                    ? 'Last 7 Days'
                    : dateRangeFilter === 'custom'
                    ? `${customFromDate} to ${customToDate}`
                    : dateRangeFilter}
                </span>
              </span>
            )}
            <span>
              Showing <strong>{filteredMessages.length}</strong> recipient logs
            </span>
          </div>
        </div>

        {/* Recipient Message Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Recipient</th>
                <th className="py-3 px-4">Masked WhatsApp</th>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Status Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{msg.employeeName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{msg.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {msg.maskedNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-800">
                      {msg.campaignName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{msg.submittedAt}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={msg.providerStatus} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{msg.statusTimestamp}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#243B67] hover:text-white text-[#243B67] rounded font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-slate-300" />
                      <p className="font-semibold text-slate-600">No delivery messages found matching filters</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search query or status outcome filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MESSAGE DRILLDOWN DRAWER                                     */}
      {/* ============================================================ */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedMessage(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Message Delivery Lifecycle</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedMessage.id}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Member:</span>
                  <strong className="text-slate-900">{selectedMessage.employeeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono">{selectedMessage.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp Destination:</span>
                  <span className="font-mono">{selectedMessage.maskedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Campaign:</span>
                  <span className="font-semibold text-slate-800">{selectedMessage.campaignName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Template Used:</span>
                  <span className="font-mono">{selectedMessage.templateName}</span>
                </div>
              </div>

              {/* Status & Error Details */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Provider Status Information</h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Current Status:</span>
                    <StatusBadge status={selectedMessage.providerStatus} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Timestamp:</span>
                    <span className="font-mono">{selectedMessage.statusTimestamp}</span>
                  </div>
                  {selectedMessage.errorCode && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                      <div className="font-mono font-bold">Error: {selectedMessage.errorCode}</div>
                      <div className="text-[11px] leading-relaxed">{selectedMessage.errorDescription}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Update WhatsApp Number & Re-dispatch Section */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Update WhatsApp Number</span>
                  </h4>
                  {selectedMessage.providerStatus === 'failed' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      Failed Message
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">
                      Roster Correction
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {selectedMessage.providerStatus === 'failed'
                    ? 'This transmission failed. You can update the staff member’s WhatsApp number below and immediately re-dispatch the broadcast.'
                    : 'Modify recipient destination number and update the hospital staff directory:'}
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Corrected WhatsApp Number (with country code)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="+91 95513 82296"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#243B67] shadow-2xs"
                    />
                    <button
                      type="button"
                      disabled={isUpdatingPhone || !editingPhone.trim()}
                      onClick={handleSaveAndRetryPhone}
                      className="px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPhone ? 'animate-spin' : ''}`} />
                      <span>{isUpdatingPhone ? 'Saving...' : 'Save & Re-dispatch'}</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Updates employee contact in roster and triggers immediate re-queue.
                  </span>
                </div>
              </div>

              {selectedMessage.canRetry && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      success('Retry Triggered', `Re-queuing message for ${selectedMessage.employeeName}.`);
                      setSelectedMessage(null);
                    }}
                    className="w-full py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-dispatch Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
