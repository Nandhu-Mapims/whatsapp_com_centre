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
  const getIconWrapper = () => {
    switch (accentColor) {
      case 'secondary':
        return 'bg-[#7B2846]/10 text-[#7B2846]';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600';
      case 'amber':
        return 'bg-amber-50 text-amber-600';
      case 'rose':
        return 'bg-rose-50 text-rose-600';
      case 'blue':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-[#243B67]/10 text-[#243B67]';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', getIconWrapper())}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium ml-auto',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
              {trend.label && <span className="text-slate-400 font-normal ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
