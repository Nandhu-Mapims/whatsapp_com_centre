import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'rose' | 'blue';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'primary',
  className,
}) => {
  const getIconStyle = () => {
    switch (accentColor) {
      case 'secondary':
        return 'bg-[#059669]/10 text-[#059669] ring-1 ring-[#059669]/20';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-600 ring-1 ring-rose-200';
      case 'blue':
        return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200';
      default:
        return 'bg-[#1E3A8A]/10 text-[#1E3A8A] ring-1 ring-[#1E3A8A]/20';
    }
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className={cn('p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105', getIconStyle())}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs gap-1">
          {subtitle && (
            <span className="text-[11px] text-slate-500 font-medium truncate" title={subtitle}>
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-auto',
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
              {trend.label && <span className="text-slate-400 font-normal ml-0.5">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
