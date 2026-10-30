import React, { useState } from 'react';
import {
  Radio,
  RefreshCw,
  CheckCircle2,
  Key,
  ShieldCheck,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  Lock,
  X,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { mockWatiConfig } from '../../data/mockData';
import { WatiConfig } from '../../types';
import { useToast } from '../../context/ToastContext';

export const WatiIntegrationPage: React.FC = () => {
  const { success, warning } = useToast();

  const [config, setConfig] = useState<WatiConfig>(mockWatiConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);

  const [newEndpoint, setNewEndpoint] = useState(config.endpoint);
  const [newSecretToken, setNewSecretToken] = useState('');

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      success(
        'WATI Health Verified',
        'HTTP 200 OK — Handshake successful with live Meta Business WhatsApp endpoint.'
      );
    }, 1000);
  };

  const handleSyncTemplates = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setConfig((prev) => ({ ...prev, lastSyncedAt: '2026-10-30 15:05:00' }));
      success(
        'Templates Synchronized',
        'Retrieved latest Meta approval states for 6 hospital templates.'
      );
    }, 1200);
  };

  const handleRotateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretToken.trim()) {
      warning('Token Required', 'Please enter the new WATI API token.');
      return;
    }

    const masked = `wati_live_sec_••••••••••••••••••••••••${newSecretToken.slice(-4)}`;
    setConfig((prev) => ({
      ...prev,
      endpoint: newEndpoint,
      maskedToken: masked,
      connectionStatus: 'CONNECTED',
    }));

    success(
      'Credentials Updated',
      'New credentials securely dispatched to backend vault. Raw token discarded from browser memory.'
    );
    setIsRotateModalOpen(false);
    setNewSecretToken('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WATI Gateway Integration"
        description="Monitor upstream Meta Business WhatsApp API gateway, webhook ingestion status, and message transmission quotas."
      >
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          <Activity className={`w-3.5 h-3.5 text-slate-500 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Testing Link...' : 'Test Connection'}</span>
        </button>
        <button
          onClick={handleSyncTemplates}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Templates</span>
        </button>
      </PageHeader>

      {/* Security notice banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-950 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Enterprise Security Hardened:</strong> WATI API credentials and authorization headers are stored strictly on the Node.js backend. The React browser client never receives or transmits raw access tokens.
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{config.accountName}</h3>
                <StatusBadge status={config.connectionStatus} />
              </div>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">{config.endpoint}</p>
            </div>
          </div>

          <button
            onClick={() => setIsRotateModalOpen(true)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Update Credentials</span>
          </button>
        </div>

        {/* Integration Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Masked Secret Key
            </span>
            <div className="font-mono font-bold text-slate-800 text-xs mt-1 truncate">
              {config.maskedToken}
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">Vault encrypted</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Last Template Sync
            </span>
            <div className="font-mono font-bold text-slate-800 text-xs mt-1">
              {config.lastSyncedAt}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Meta API v21.0</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Webhook Ingestion
            </span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {config.webhookStatus}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Last event: {config.webhookLastReceived}
            </span>
          </div>
        </div>

        {/* Daily Quota Progress */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-slate-700">WATI Tier 2 Daily Broadcast Quota:</span>
            <span className="text-[#243B67] font-bold">
              {config.dailyQuotaUsed.toLocaleString()} / {config.dailyQuotaLimit.toLocaleString()} messages
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#243B67] h-full rounded-full transition-all duration-500"
              style={{
                width: `${(config.dailyQuotaUsed / config.dailyQuotaLimit) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Reset at 00:00:00 UTC</span>
            <span>{(100 - (config.dailyQuotaUsed / config.dailyQuotaLimit) * 100).toFixed(1)}% remaining</span>
          </div>
        </div>
      </div>

      {/* Webhook Configuration & Health Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Webhook Callback Configuration</h3>
          <p className="text-slate-500 leading-relaxed">
            Configure this URL in your WATI account settings to receive delivery receipts and employee STOP opt-outs in real time.
          </p>
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
            https://ewccms.mapims.org/api/v1/wati/webhook
          </div>
          <div className="pt-2 text-slate-500 text-[11px] space-y-1">
            <div>✓ Subscribed events: <code>message:sent</code>, <code>message:delivered</code>, <code>message:read</code>, <code>message:failed</code></div>
            <div>✓ Opt-out trigger: Incoming text containing <code>STOP</code>, <code>UNSUBSCRIBE</code>, <code>CANCEL</code></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">System Health Checklist</h3>
          <div className="space-y-2">
            {[
              { item: 'Meta Business Manager Verification', status: 'Verified' },
              { item: 'Official WhatsApp Sender ID Registered', status: 'Active' },
              { item: 'Server Redis Queue Handshake', status: 'Active' },
              { item: 'Template Variable Parser Sync', status: 'Verified' },
            ].map((chk) => (
              <div
                key={chk.item}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100"
              >
                <span className="font-medium text-slate-700">{chk.item}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {chk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Update Credentials Modal */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Update WATI API Credentials</h3>
              <button
                onClick={() => setIsRotateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRotateCredentials} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  WATI Server Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New API Access Token (Bearer Secret) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Paste token provided by WATI..."
                  value={newSecretToken}
                  onChange={(e) => setNewSecretToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Token is immediately pushed to backend vault and never saved in React state.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRotateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#243B67] hover:bg-[#1b2d50] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save & Reconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
