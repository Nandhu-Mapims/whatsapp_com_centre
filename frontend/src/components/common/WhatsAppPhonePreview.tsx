import React from 'react';
import { CheckCheck, ExternalLink, Phone, FileText, Video, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { WhatsAppTemplate } from '../../types';

interface WhatsAppPhonePreviewProps {
  template: WhatsAppTemplate;
  variables: Record<string, string>;
  headerMediaUrl?: string;
  sampleRecipientName?: string;
}

export const WhatsAppPhonePreview: React.FC<WhatsAppPhonePreviewProps> = ({
  template,
  variables,
  headerMediaUrl,
  sampleRecipientName = 'Dr. A. Saravanan',
}) => {
  // Substitute variables in body
  let renderedBody = template.body;

  // Replace {{1}}, {{2}} etc. with substituted values or highlighted tags
  renderedBody = renderedBody.replace(/\{\{(\d+)\}\}/g, (_match, p1) => {
    const val = variables[p1];
    if (val) {
      if (val.includes('{{employee.name}}')) {
        return sampleRecipientName;
      }
      return val;
    }
    // Check template default sampleValue
    const variableDef = template.variables.find((v) => v.key === p1);
    if (variableDef?.sampleValue) {
      return variableDef.sampleValue;
    }
    return `[Missing Var {{${p1}}}]`;
  });

  return (
    <div className="flex flex-col items-center">
      {/* Device frame container */}
      <div className="w-[340px] rounded-[36px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700/60 ring-1 ring-slate-800">
        {/* Phone screen */}
        <div className="w-full bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[580px] relative shadow-inner">
          {/* WhatsApp Header Bar */}
          <div className="bg-[#243B67] text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#243B67] font-bold text-xs ring-2 ring-white/20">
              MAP
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate">MAPIMS Hospitals</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-200 opacity-90 truncate">Official Verified Account</p>
            </div>
          </div>

          {/* Subheader recipient indicator */}
          <div className="bg-slate-800/10 backdrop-blur-xs text-[11px] text-slate-600 px-3 py-1 text-center font-medium border-b border-slate-200">
            Previewing message as: <span className="font-semibold text-slate-800">{sampleRecipientName}</span>
          </div>

          {/* Chat wallpaper area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            <div className="flex justify-center my-1">
              <span className="bg-white/80 backdrop-blur-xs text-[10px] font-medium text-slate-600 px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                Today
              </span>
            </div>

            {/* WhatsApp message bubble */}
            <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-sm max-w-[95%] border border-slate-200/50 space-y-2.5 text-slate-900">
              {/* Header Rendering */}
              {template.headerType === 'TEXT' && template.headerContent && (
                <div className="font-bold text-sm text-[#243B67] border-b border-slate-100 pb-1.5">
                  {template.headerContent}
                </div>
              )}

              {template.headerType === 'IMAGE' && (
                <div className="rounded-lg overflow-hidden bg-slate-100 max-h-40 border border-slate-200">
                  <img
                    src={headerMediaUrl || template.headerContent || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60'}
                    alt="Template Header"
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="hidden only:flex items-center justify-center p-6 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                </div>
              )}

              {template.headerType === 'DOCUMENT' && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-700">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate font-medium">Official_Circular_Document.pdf</div>
                </div>
              )}

              {template.headerType === 'VIDEO' && (
                <div className="p-3 rounded-lg bg-slate-900 text-white flex items-center justify-center gap-2 text-xs">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Hospital Training Video (MP4)</span>
                </div>
              )}

              {/* Message Body */}
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                {renderedBody}
              </div>

              {/* Message Footer */}
              {template.footer && (
                <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-50">
                  {template.footer}
                </div>
              )}

              {/* Timestamp and double blue tick */}
              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
                <span>14:48</span>
                <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
              </div>
            </div>

            {/* Interactive Buttons Stack */}
            {template.buttons && template.buttons.length > 0 && (
              <div className="space-y-1.5 max-w-[95%]">
                {template.buttons.map((btn, index) => (
                  <div
                    key={index}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200/90 text-center text-xs font-semibold text-[#243B67] shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {btn.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                    {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5 text-[#243B67]" />}
                    <span>{btn.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom input simulation bar */}
          <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 text-slate-400 text-xs border-t border-slate-200/70">
            <div className="flex-1 bg-white py-1.5 px-3 rounded-full text-slate-400 text-[11px] border border-slate-200">
              Type a message...
            </div>
            <div className="w-7 h-7 rounded-full bg-[#243B67] text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs text-slate-500 font-medium">WhatsApp Mobile Preview (Meta Verified)</span>
      </div>
    </div>
  );
};
