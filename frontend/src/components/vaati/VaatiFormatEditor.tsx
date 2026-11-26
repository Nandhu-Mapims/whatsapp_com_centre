import React from 'react';
import { ExternalLink, FileText, Image as ImageIcon, Upload, X } from 'lucide-react';
import { VaatiMessageType } from '../../types/vaati';

export const VAATI_FORMAT_OPTIONS: Array<{
  id: VaatiMessageType;
  label: string;
  shortLabel: string;
  icon: string;
  endpoint: string;
  badgeClass: string;
}> = [
  {
    id: 'text',
    label: '💬 Text Only',
    shortLabel: '💬 Text',
    icon: '💬',
    endpoint: '/api/sendText',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'url_text',
    label: '🌐 URL + Text',
    shortLabel: '🌐 URL + Text',
    icon: '🌐',
    endpoint: '/api/sendText (Link Card)',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  {
    id: 'image_text',
    label: '🖼️ Image + Text',
    shortLabel: '🖼️ Image + Text',
    icon: '🖼️',
    endpoint: '/api/sendFile',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  {
    id: 'pdf_text',
    label: '📄 PDF + Text',
    shortLabel: '📄 PDF + Text',
    icon: '📄',
    endpoint: '/api/sendFile',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
  },
  {
    id: 'poll',
    label: '🔘 1-Tap Buttons (Yes/No)',
    shortLabel: '🔘 1-Tap Buttons',
    icon: '🔘',
    endpoint: '/api/sendPoll',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
  },
];

export const VaatiFormatBadge: React.FC<{ messageType?: VaatiMessageType }> = ({
  messageType = 'text',
}) => {
  const opt = VAATI_FORMAT_OPTIONS.find((o) => o.id === messageType) || VAATI_FORMAT_OPTIONS[0];
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeClass}`}
    >
      {opt.shortLabel}
    </span>
  );
};

interface VaatiFormatEditorProps {
  messageType: VaatiMessageType;
  onChangeType: (next: VaatiMessageType) => void;
  ctaUrl: string;
  onChangeCtaUrl: (val: string) => void;
  mediaUrl: string;
  mediaFilename: string;
  mediaMimetype: string;
  onChangeMedia: (next: { url: string; filename?: string; mimetype?: string }) => void;
  pollOptions: string[];
  onChangePollOptions: (next: string[]) => void;
  multipleAnswers: boolean;
  onChangeMultipleAnswers: (val: boolean) => void;
  compact?: boolean;
}

export const VaatiFormatEditor: React.FC<VaatiFormatEditorProps> = ({
  messageType,
  onChangeType,
  ctaUrl,
  onChangeCtaUrl,
  mediaUrl,
  mediaFilename,
  onChangeMedia,
  pollOptions,
  onChangePollOptions,
  multipleAnswers,
  onChangeMultipleAnswers,
  compact = false,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, expectedKind: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Please select a file smaller than 15 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        onChangeMedia({
          url: result,
          filename: file.name,
          mimetype: file.type || (expectedKind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* 5 Format Option Pills */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-bold text-slate-700 text-xs">
            VAATI Message Payload Format *
          </label>
          <span className="text-[10px] font-mono text-slate-400">
            {VAATI_FORMAT_OPTIONS.find((o) => o.id === messageType)?.endpoint}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          {VAATI_FORMAT_OPTIONS.map((opt) => {
            const active = messageType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeType(opt.id)}
                className={`${compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'} rounded-lg font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#C76323] text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* URL + Text Configuration */}
      {messageType === 'url_text' && (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
          <label className="font-bold text-indigo-950 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Clickable Portal / CTA Link URL *</span>
          </label>
          <input
            type="text"
            value={ctaUrl}
            onChange={(e) => onChangeCtaUrl(e.target.value)}
            placeholder="https://inc.mapims.edu.in/login or {{app_url}}"
            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-indigo-700">
            Sent with WhatsApp <code className="font-mono">linkPreview: true</code>. Appended automatically if not already in the body.
          </p>
        </div>
      )}

      {/* Image + Text Configuration */}
      {messageType === 'image_text' && (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <label className="font-bold text-emerald-950 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Image Attachment (URL or Upload) *</span>
            </label>
            <label className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs">
              <Upload className="w-3 h-3" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={mediaUrl.startsWith('data:') ? '[Uploaded Local Image]' : mediaUrl}
              onChange={(e) =>
                onChangeMedia({
                  url: e.target.value,
                  filename: mediaFilename || 'announcement.jpg',
                  mimetype: 'image/jpeg',
                })
              }
              placeholder="https://example.com/poster.jpg"
              className="sm:col-span-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={mediaFilename}
              onChange={(e) => onChangeMedia({ url: mediaUrl, filename: e.target.value })}
              placeholder="MAPIMS_Poster.jpg"
              className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 font-medium"
            />
          </div>
          {mediaUrl && (
            <div className="flex items-center gap-3 pt-1">
              <img
                src={mediaUrl}
                alt="Attachment preview"
                className="w-16 h-16 object-cover rounded-lg border border-emerald-200 bg-white"
              />
              <div className="flex-1 text-[10px] text-emerald-800 truncate">
                Ready to send as <strong>{mediaFilename || 'MAPIMS_Announcement.jpg'}</strong> with message text as caption.
              </div>
              {mediaUrl.startsWith('data:') && (
                <button
                  type="button"
                  onClick={() => onChangeMedia({ url: '', filename: '', mimetype: '' })}
                  className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                  title="Clear uploaded image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF + Text Configuration */}
      {messageType === 'pdf_text' && (
        <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <label className="font-bold text-rose-950 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF Document Attachment (URL or Upload) *</span>
            </label>
            <label className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs">
              <Upload className="w-3 h-3" />
              <span>Upload PDF</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'pdf')}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={mediaUrl.startsWith('data:') ? '[Uploaded Local PDF]' : mediaUrl}
              onChange={(e) =>
                onChangeMedia({
                  url: e.target.value,
                  filename: mediaFilename || 'MAPIMS_Circular.pdf',
                  mimetype: 'application/pdf',
                })
              }
              placeholder="https://example.com/circular.pdf"
              className="sm:col-span-2 px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <input
              type="text"
              value={mediaFilename}
              onChange={(e) => onChangeMedia({ url: mediaUrl, filename: e.target.value })}
              placeholder="MAPIMS_Circular.pdf"
              className="px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 font-medium"
            />
          </div>
          {mediaUrl && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-rose-200 text-[11px] text-rose-900">
              <span className="font-semibold truncate">
                📄 {mediaFilename || 'MAPIMS_Circular.pdf'} (application/pdf)
              </span>
              {mediaUrl.startsWith('data:') && (
                <button
                  type="button"
                  onClick={() => onChangeMedia({ url: '', filename: '', mimetype: '' })}
                  className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                  title="Clear uploaded PDF"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1-Tap Response Buttons (Poll) Configuration */}
      {messageType === 'poll' && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 text-xs">
              1-Tap Response Buttons (min 2 options)
            </span>
            <button
              type="button"
              onClick={() => onChangePollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              + Add Option
            </button>
          </div>
          <div className="space-y-1.5">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    onChangePollOptions(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C76323]"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onChangePollOptions(pollOptions.filter((_, i) => i !== idx))}
                    className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-700 font-medium pt-1">
            <input
              type="checkbox"
              checked={multipleAnswers}
              onChange={(e) => onChangeMultipleAnswers(e.target.checked)}
              className="rounded border-slate-300 text-[#C76323]"
            />
            <span>Allow multiple selections (off = single 1-tap choice)</span>
          </label>
        </div>
      )}
    </div>
  );
};

interface VaatiPreviewAttachmentProps {
  messageType: VaatiMessageType;
  ctaUrl?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  pollOptions?: string[];
  multipleAnswers?: boolean;
}

export const VaatiPreviewAttachment: React.FC<VaatiPreviewAttachmentProps> = ({
  messageType,
  ctaUrl,
  mediaUrl,
  mediaFilename,
  pollOptions = [],
  multipleAnswers,
}) => {
  if (messageType === 'image_text' && mediaUrl) {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <img src={mediaUrl} alt="WhatsApp Image" className="w-full max-h-40 object-cover" />
      </div>
    );
  }
  if (messageType === 'pdf_text') {
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
        <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900 text-[11px] truncate">
            {mediaFilename || 'MAPIMS_Circular.pdf'}
          </div>
          <div className="text-[9px] text-slate-500">PDF Document • Tap to open</div>
        </div>
      </div>
    );
  }
  if (messageType === 'url_text' && ctaUrl) {
    return (
      <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[10px]">
        <div className="font-bold text-indigo-900 truncate">🌐 Link Preview Card</div>
        <div className="text-indigo-700 underline font-mono truncate">{ctaUrl}</div>
      </div>
    );
  }
  if (messageType === 'poll' && pollOptions.length >= 2) {
    return (
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-400 font-semibold">
          {multipleAnswers ? 'Select one or more' : 'Select one'}
        </div>
        {pollOptions
          .filter((o) => o.trim())
          .map((opt, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 inline-block shrink-0" />
                <span>{opt}</span>
              </div>
              <span className="text-[10px] text-slate-400">0</span>
            </div>
          ))}
      </div>
    );
  }
  return null;
};

