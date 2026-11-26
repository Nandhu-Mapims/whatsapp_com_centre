import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Database,
  Phone,
  Building2,
  Sparkles,
  Zap,
  Quote,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { VaatiReplyRecord, VaatiTemplate } from '../../types/vaati';
import { useToast } from '../../context/ToastContext';

export const VaatiRepliesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateFilter = searchParams.get('templateId') || 'ALL';
  const { success, error } = useToast();

  const [replies, setReplies] = useState<VaatiReplyRecord[]>([]);
  const [templates, setTemplates] = useState<VaatiTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [templateFilter, setTemplateFilter] = useState(initialTemplateFilter);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'REVIEWED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [totalReplies, setTotalReplies] = useState(0);
  const [newRepliesCount, setNewRepliesCount] = useState(0);
  const [trackedQuestionsCount, setTrackedQuestionsCount] = useState(0);

  // Admin note inline editor state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchTemplates = () => {
    fetch('/api/vaati/templates', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
        }
      })
      .catch(() => {});
  };

  const fetchReplies = (triggerSync = false) => {
    if (!triggerSync) setIsLoading(true);
    fetch(`/api/vaati/replies${triggerSync ? '?sync=true' : ''}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReplies(json.replies || []);
          setTotalReplies(json.totalReplies || 0);
          setNewRepliesCount(json.newRepliesCount || 0);
          setTrackedQuestionsCount(json.trackedQuestionsCount || 0);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch VAATI replies:', err);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/vaati/replies/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReplies(json.replies || []);
        setTotalReplies(json.totalReplies || 0);
        setNewRepliesCount(json.newRepliesCount || 0);
        setTrackedQuestionsCount(json.trackedQuestionsCount || 0);
        if (json.newReplies > 0) {
          success('New Replies Saved', `Captured ${json.newReplies} new user reply(s) to MongoDB.`);
        } else {
          success('WhatsApp Synced', `Checked ${json.syncedChats || 0} active chats. Inbox is up to date.`);
        }
      } else {
        error('Sync Failed', json.message || 'Could not sync replies from VAATI.');
      }
    } catch (err: any) {
      error('Network Error', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchReplies(true);
    const interval = setInterval(() => {
      fetchReplies(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (
    reply: VaatiReplyRecord,
    nextStatus: 'NEW' | 'REVIEWED',
    customNote?: string
  ) => {
    setSavingId(reply.replyId);
    try {
      const res = await fetch(
        `/api/vaati/replies/${encodeURIComponent(reply.replyId)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: JSON.stringify({
            status: nextStatus,
            ...(customNote !== undefined ? { adminNote: customNote } : {}),
          }),
        }
      );
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setReplies((prev) =>
          prev.map((r) => (r.replyId === reply.replyId ? json.data : r))
        );
        setEditingNoteId(null);
        success('Updated', `Reply saved as ${nextStatus}.`);
      } else {
        error('Update Failed', json.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteReply = async (reply: VaatiReplyRecord) => {
    if (!confirm(`Delete reply from ${reply.senderName}?`)) return;
    try {
      const res = await fetch(
        `/api/vaati/replies/${encodeURIComponent(reply.replyId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setReplies((prev) => prev.filter((r) => r.replyId !== reply.replyId));
        setTotalReplies((c) => Math.max(0, c - 1));
        success('Deleted', 'Reply removed from database.');
      } else {
        error('Delete Failed', json.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const replyEnabledTemplatesCount = useMemo(
    () => templates.filter((t) => Boolean(t.allowReplies)).length,
    [templates]
  );

  const filteredReplies = useMemo(() => {
    return replies.filter((r) => {
      const matchesTemplate =
        templateFilter === 'ALL' ||
        r.templateId === templateFilter ||
        r.templateName === templateFilter;
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.senderName.toLowerCase().includes(q) ||
        r.senderPhone.toLowerCase().includes(q) ||
        r.replyText.toLowerCase().includes(q) ||
        r.templateTitle.toLowerCase().includes(q) ||
        r.questionText.toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q);
      return matchesTemplate && matchesStatus && matchesSearch;
    });
  }, [replies, templateFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="VAATI Template Replies Inbox"
        description="View staff & user WhatsApp replies to question templates with Replies turned ON. All captured responses are saved to MongoDB."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/vaati/templates')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VAATI Templates</span>
          </button>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing WhatsApp...' : 'Sync Replies Now'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Saved Replies (DB)</div>
            <div className="text-xl font-black text-slate-900">{totalReplies}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Unreviewed</div>
            <div className="text-xl font-black text-slate-900">{newRepliesCount}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Templates Reply ON</div>
            <div className="text-xl font-black text-slate-900">{replyEnabledTemplatesCount}</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Tracked Questions</div>
            <div className="text-xl font-black text-slate-900">{trackedQuestionsCount}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Question Templates</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.allowReplies ? '🟢 [ON] ' : '⚪ [OFF] '}
                {t.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'NEW', 'REVIEWED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'NEW' ? 'New' : 'Reviewed'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff name, phone, question, reply..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Replies List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading saved replies from MongoDB...</span>
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">No Template Replies Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Turn <strong>Reply ON</strong> on any VAATI template question and send it to staff via Quick Test or Broadcast. As soon as they reply on WhatsApp, their answer is saved automatically to MongoDB here.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => navigate('/vaati/templates')}
              className="px-4 py-2 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Configure Template Replies (ON/OFF)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReplies.map((rep) => (
            <div
              key={rep.replyId}
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition-all ${
                rep.status === 'NEW' ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              {/* Top Bar */}
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>{rep.senderName}</span>
                    {rep.employeeId && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {rep.employeeId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {rep.senderPhone}
                  </span>
                  {rep.department && (
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {rep.department}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>Saved in DB</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rep.status === 'REVIEWED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {rep.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(rep.repliedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Body: Question & Answer */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Admin Question */}
                <div className="md:col-span-5 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Quote className="w-3 h-3" />
                      <span>Template Question</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {rep.templateTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line line-clamp-4 leading-relaxed">
                    {rep.questionText}
                  </p>
                </div>

                {/* User Reply */}
                <div className="md:col-span-7 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      {rep.replyType === 'poll_vote' ? '🔘 1-Tap Poll Selection' : '💬 User Reply'}
                    </span>
                    {rep.quotedMatch && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-700">
                        Direct Quote Reply
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                    {rep.replyText}
                  </p>

                  {rep.adminNote && editingNoteId !== rep.replyId && (
                    <div className="text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 text-slate-700">
                      <strong>Admin Note:</strong> {rep.adminNote}
                    </div>
                  )}

                  {editingNoteId === rep.replyId && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add admin remark / follow-up note..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={savingId === rep.replyId}
                        onClick={() => handleUpdateStatus(rep, 'REVIEWED', noteDraft)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNoteId(editingNoteId === rep.replyId ? null : rep.replyId);
                    setNoteDraft(rep.adminNote || '');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px]"
                >
                  {rep.adminNote ? 'Edit Note' : 'Add Note'}
                </button>
                <button
                  type="button"
                  disabled={savingId === rep.replyId}
                  onClick={() =>
                    handleUpdateStatus(rep, rep.status === 'REVIEWED' ? 'NEW' : 'REVIEWED')
                  }
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 border transition-colors ${
                    rep.status === 'REVIEWED'
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{rep.status === 'REVIEWED' ? 'Reopen as New' : 'Mark Reviewed'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReply(rep)}
                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete reply"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default VaatiRepliesPage;

