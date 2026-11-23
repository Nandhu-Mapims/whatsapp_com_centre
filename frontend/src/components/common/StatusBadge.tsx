import React from 'react';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStyle = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'active' || lower === 'approved' || lower === 'completed' || lower === 'delivered' || lower === 'opted-in' || lower === 'ready' || lower === 'connected' || lower === 'success') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (lower === 'pending' || lower === 'pending approval' || lower === 'scheduled' || lower === 'processing' || lower === 'generating' || lower === 'pending verification') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (lower === 'rejected' || lower === 'failed' || lower === 'opted-out' || lower === 'deactivated' || lower === 'cancelled' || lower === 'disconnected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (lower === 'draft' || lower === 'unknown' || lower === 'queued' || lower === 'submitted') {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    if (lower === 'read') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (lower === 'urgent' || lower === 'emergency') {
      return 'bg-[#059669]/10 text-[#059669] border-[#059669]/20 font-semibold';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        getStyle(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current opacity-80" />
      {status}
    </span>
  );
};
