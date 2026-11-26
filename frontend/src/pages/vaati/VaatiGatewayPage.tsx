import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Radio,
  ExternalLink,
  RefreshCw,
  Phone,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Power,
  Server,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { VaatiMessageType } from '../../types/vaati';
import { VaatiFormatEditor } from '../../components/vaati/VaatiFormatEditor';
import { WhatsAppFormattingToolbar } from '../../components/vaati/WhatsAppFormattingToolbar';
import { useToast } from '../../context/ToastContext';

export const VaatiGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Quick dispatch tester
  const [testNumber, setTestNumber] = useState('+91 95513 82296');
  const [senderSession, setSenderSession] = useState('tenant_efs');
  const [dispatchMode, setDispatchMode] = useState<VaatiMessageType>('poll');
  const [testMessage, setTestMessage] = useState(
    'Order Confirmation: Do you want to confirm your delivery for today?'
  );
  const [ctaUrl, setCtaUrl] = useState('https://inc.mapims.edu.in/login');
  const [mediaUrl, setMediaUrl] = useState(
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  );
  const [mediaFilename, setMediaFilename] = useState('MAPIMS_Circular.pdf');
  const [mediaMimetype, setMediaMimetype] = useState('application/pdf');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Yes, Confirm 👍',
    'No, Cancel ❌',
  ]);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  const fetchStatus = () => {
    setIsLoading(true);
    fetch('/api/gateway/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setGatewayStatus(json.data);
          if (!senderSession && json.data.vaati?.session) {
            setSenderSession(json.data.vaati.session);
          }
        }
      })
      .catch((err) => console.error('Failed to query gateway status:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (enable: boolean) => {
    setIsToggling(true);
    try {
      const res = await fetch('/api/gateway/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ gateway: 'VAATI', enabled: enable }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        success('Gateway State Changed', json.message);
        fetchStatus();
      } else {
        error('Toggle Failed', json.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDirectSend = async () => {
    if (!testMessage.trim()) {
      warning('Empty Message', 'Please enter a message to send.');
      return;
    }
    setIsSending(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/campaigns/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          whatsappNumber: testNumber,
          gateway: 'VAATI',
          session: senderSession || 'tenant_efs',
          messageType: dispatchMode,
          ctaUrl: dispatchMode === 'url_text' ? ctaUrl.trim() : undefined,
          mediaUrl: dispatchMode === 'image_text' || dispatchMode === 'pdf_text' ? mediaUrl.trim() : undefined,
          mediaFilename: dispatchMode === 'image_text' || dispatchMode === 'pdf_text' ? mediaFilename.trim() : undefined,
          mediaMimetype: dispatchMode === 'image_text' || dispatchMode === 'pdf_text' ? mediaMimetype.trim() : undefined,
          pollOptions: dispatchMode === 'poll' ? pollOptions.filter((o) => o.trim()) : undefined,
          multipleAnswers: dispatchMode === 'poll' ? multipleAnswers : false,
          customMessage: testMessage.trim(),
          broadcastTitle: `VAATI ${dispatchMode} Direct Test`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDispatchResult({
          success: true,
          message: json.message,
          providerMessageId: json.providerMessageId,
          timestamp: new Date().toLocaleTimeString(),
        });
        success('Message Delivered', `Sent via VAATI to ${testNumber}!`);
      } else {
        setDispatchResult({
          success: false,
          message: json.message || 'Dispatch failed.',
          timestamp: new Date().toLocaleTimeString(),
        });
        error('Dispatch Failed', json.message);
      }
    } catch (err: any) {
      setDispatchResult({
        success: false,
        message: err.message || 'Network error.',
        timestamp: new Date().toLocaleTimeString(),
      });
      error('Network Error', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const isEnabled = Boolean(gatewayStatus?.isVaatiEnabled);
  const isOnline = Boolean(gatewayStatus?.vaati?.online && isEnabled);

  return (
    <div className="space-y-6">
      <PageHeader
        title="VAATI Gateway & Node Status"
        description="Manage the self-hosted WhatsApp Web API instance running on your VPS. Inspect session health, toggle power, and test dispatches."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/vaati/templates')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VAATI Templates</span>
          </button>
          <button
            onClick={fetchStatus}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </PageHeader>

      {/* Main Node Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C76323] text-white flex items-center justify-center font-black text-xl shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  VAATI Node (WAHA Instance)
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : isEnabled
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {isOnline ? '🟢 ONLINE & LINKED' : isEnabled ? '🟡 STARTING' : '🔴 TURNED OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Session: <span className="font-mono text-slate-700">{gatewayStatus?.vaati?.session || 'tenant_efs'}</span>
              </p>
            </div>
          </div>

          {/* Master Power Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggle(!isEnabled)}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all border ${
                isEnabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isEnabled ? 'Turn OFF VAATI Gateway' : 'Turn ON VAATI Gateway'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Linked WhatsApp Session
            </span>
            <span className="font-extrabold text-slate-900 text-sm mt-1 block font-mono">
              {gatewayStatus?.vaati?.session || 'tenant_efs'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {isOnline ? 'Connected & Ready' : 'Disconnected'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Gateway Status
            </span>
            <span className={`font-extrabold text-sm mt-1 block ${isEnabled ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isEnabled ? 'Enabled (Active)' : 'Disabled (OFF)'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Switch ON/OFF anytime
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Fallback Gateway
            </span>
            <span className="font-extrabold text-blue-900 text-sm mt-1 block">
              WATI Meta Cloud
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Auto-activates if VAATI is OFF
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Direct Dispatch Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-[#C76323]" />
              <h4 className="font-extrabold text-slate-900 text-sm">
                Direct VAATI Dispatch Terminal
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Live Pipe
            </span>
          </div>

          {gatewayStatus?.vaati?.connectedSessions && gatewayStatus.vaati.connectedSessions.length > 1 && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Send From WhatsApp Account *</label>
              <select
                value={senderSession || gatewayStatus.vaati.session}
                onChange={(e) => setSenderSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C76323] text-xs"
              >
                {gatewayStatus.vaati.connectedSessions.map((s: any) => (
                  <option key={s.name} value={s.name}>
                    🟢 {s.pushName || 'WhatsApp User'} ({s.phone || s.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Recipient WhatsApp Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+91 95513 82296"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C76323]"
              />
            </div>
          </div>

          {/* 5-Option Format Selector (Text, URL+Text, Image+Text, PDF+Text, 1-Tap Buttons) */}
          <VaatiFormatEditor
            compact
            messageType={dispatchMode}
            onChangeType={(next) => {
              setDispatchMode(next);
              if (next === 'pdf_text') {
                setMediaUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                setMediaFilename('MAPIMS_Circular.pdf');
                setMediaMimetype('application/pdf');
                setTestMessage('Om sakthi,\nPlease find attached the official MAPIMS PDF circular.');
              } else if (next === 'image_text') {
                setMediaUrl('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800');
                setMediaFilename('MAPIMS_Poster.jpg');
                setMediaMimetype('image/jpeg');
                setTestMessage('Om sakthi,\nHospital Announcement Poster attached below!');
              } else if (next === 'url_text') {
                setTestMessage('Om sakthi,\nOur Hospital Portal is now live! Tap the link below:');
              } else if (next === 'text') {
                setTestMessage('Om sakthi,\nHello from VAATI Self-Hosted WhatsApp Gateway!');
              } else if (next === 'poll') {
                setTestMessage('Order Confirmation: Do you want to confirm your delivery for today?');
              }
            }}
            ctaUrl={ctaUrl}
            onChangeCtaUrl={setCtaUrl}
            mediaUrl={mediaUrl}
            mediaFilename={mediaFilename}
            mediaMimetype={mediaMimetype}
            onChangeMedia={({ url, filename, mimetype }) => {
              setMediaUrl(url);
              if (filename !== undefined) setMediaFilename(filename);
              if (mimetype !== undefined) setMediaMimetype(mimetype);
            }}
            pollOptions={pollOptions}
            onChangePollOptions={setPollOptions}
            multipleAnswers={multipleAnswers}
            onChangeMultipleAnswers={setMultipleAnswers}
          />

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {dispatchMode === 'poll'
                ? 'Poll Question / Prompt (poll.name) *'
                : dispatchMode === 'image_text' || dispatchMode === 'pdf_text'
                ? 'Caption Text *'
                : 'Message Body *'}
            </label>
            <WhatsAppFormattingToolbar
              textareaId="gatewayDirectMessageTextarea"
              value={testMessage}
              onChange={setTestMessage}
            />
            <textarea
              id="gatewayDirectMessageTextarea"
              rows={dispatchMode === 'poll' ? 3 : 4}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#C76323] leading-relaxed resize-y font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Dispatched via {dispatchMode === 'poll' ? '/api/sendPoll' : dispatchMode === 'image_text' || dispatchMode === 'pdf_text' ? '/api/sendFile' : '/api/sendText'} on "{senderSession || gatewayStatus?.vaati?.session || 'tenant_efs'}".
            </span>
            <button
              type="button"
              disabled={isSending || !isEnabled}
              onClick={handleDirectSend}
              className="px-5 py-2.5 bg-[#C76323] hover:bg-[#B0541C] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-60"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch via VAATI</span>
                </>
              )}
            </button>
          </div>

          {dispatchResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 mt-3 ${
                dispatchResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {dispatchResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold">{dispatchResult.message}</div>
                {dispatchResult.providerMessageId && (
                  <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                    ID: {dispatchResult.providerMessageId} • {dispatchResult.timestamp}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info & Architectural Advantages */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Why VAATI for Hospital Announcements?</span>
          </h4>

          <div className="space-y-3 text-slate-600 leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">
                1. Rich Custom Formats & Two-Way Replies
              </span>
              Send Text, URL + Text, Image + Text, PDF + Text, and 1-Tap Response Polls, and optionally collect staff replies into MongoDB.
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">
                2. Custom Hospital Templates
              </span>
              Create templates for hospital applications, duty rosters, and clinical notices without wait cycles.
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">
                3. Total Safety with On/Off Control
              </span>
              You can turn VAATI ON or OFF at any moment. When OFF, the system falls back cleanly to WATI without service interruption.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VaatiGatewayPage;
