import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 mb-6">
      <div>
        <h1 className="text-3xl md:text-[40px] font-light tracking-tight text-campus-text leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-campus-textMuted mt-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 self-start md:self-auto">{actions}</div>}
    </div>
  );
};

interface ChipProps {
  label: string;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  count?: number;
}

export const Chip: React.FC<ChipProps> = ({ label, active = false, icon: Icon, onClick, count }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-campus-jade-700 ${
        active
          ? 'bg-campus-text text-white shadow-xs'
          : 'bg-white/80 text-campus-textMuted hover:bg-white hover:text-campus-text shadow-xs'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-campus-surface text-campus-textDim'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export type CardTint = 'tint-1' | 'tint-2' | 'tint-3' | 'tint-4' | 'default';

interface CardProps {
  children: React.ReactNode;
  tint?: CardTint;
  className?: string;
  onClick?: () => void;
}

const tintStyles: Record<CardTint, string> = {
  'tint-1': 'bg-[var(--card-tint-1)]',
  'tint-2': 'bg-[var(--card-tint-2)]',
  'tint-3': 'bg-[var(--card-tint-3)]',
  'tint-4': 'bg-[var(--card-tint-4)]',
  'default': 'bg-white',
};

export const Card: React.FC<CardProps> = ({ children, tint = 'default', className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-[22px] p-5 shadow-card transition-all ${tintStyles[tint]} ${
        onClick ? 'cursor-pointer hover:shadow-elevated hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface BadgeProps {
  label: string;
  variant?: 'sage' | 'jade' | 'amber' | 'blush' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

const badgeVariants = {
  sage: 'bg-campus-sage-100 text-campus-sage-900',
  jade: 'bg-campus-jade-50 text-campus-jade-700',
  amber: 'bg-campus-alert-amberBg text-campus-alert-amber',
  blush: 'bg-campus-alert-redBg text-campus-alert-red font-medium',
  neutral: 'bg-campus-surface text-campus-textDim',
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'sage', icon: Icon }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${badgeVariants[variant]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </span>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
      <div className={`bg-white rounded-[24px] ${maxWidth} w-full p-6 shadow-elevated relative max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-campus-borderSubtle">
          <h2 className="text-base font-medium text-campus-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-campus-textDim hover:text-campus-text hover:bg-campus-surface"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="rounded-[22px] bg-white/60 p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-campus-surface flex items-center justify-center text-campus-textDim mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-medium text-campus-text mb-1">{title}</h3>
      {description && <p className="text-xs text-campus-textMuted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 bg-campus-surface rounded-[22px]" />
      ))}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  tint?: CardTint;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, tint = 'default' }) => {
  return (
    <Card tint={tint} className="p-4">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-campus-textDim">{label}</div>
      <div className="text-2xl font-light tracking-tight text-campus-text mt-0.5">{value}</div>
      {subtext && <div className="text-[11px] text-campus-textMuted mt-0.5">{subtext}</div>}
    </Card>
  );
};

interface ProgressBarProps {
  percentage: number;
  label?: string;
  variant?: 'jade' | 'amber' | 'blush';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, label, variant = 'jade' }) => {
  const barColors = {
    jade: 'bg-campus-jade-700',
    amber: 'bg-campus-alert-amber',
    blush: 'bg-campus-alert-red',
  };

  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div>
      {label && (
        <div className="flex justify-between text-[11px] text-campus-textMuted mb-1 font-medium">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColors[variant]}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
};

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  targetValue?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({ data, targetValue = 80 }) => {
  const max = 100;
  return (
    <div className="flex items-end justify-between gap-2 h-20 pt-2">
      {data.map((item, idx) => {
        const heightPct = Math.round((item.value / max) * 100);
        const isTargetMet = item.value >= targetValue;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-[9px] font-semibold text-campus-textDim">{item.value}%</span>
            <div className="w-full max-w-[20px] bg-black/5 rounded-t-md h-full flex items-end overflow-hidden">
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isTargetMet ? 'bg-campus-jade-700' : 'bg-campus-alert-amber'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[9px] text-campus-textDim uppercase tracking-wider truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
