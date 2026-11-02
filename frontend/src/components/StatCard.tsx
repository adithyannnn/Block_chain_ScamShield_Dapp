import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'teal' | 'amber' | 'rose' | 'default';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan',
}) => {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
    },
    teal: {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      iconBg: 'bg-teal-500/10 text-teal-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(20,184,166,0.15)]',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(239,68,68,0.15)]',
    },
    default: {
      border: 'border-slate-800 hover:border-slate-700',
      iconBg: 'bg-slate-800 text-slate-300',
      glow: '',
    },
  }[variant];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-navy-900/90 p-5 border backdrop-blur-sm transition-all duration-300 ${variantStyles.border} ${variantStyles.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${variantStyles.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

