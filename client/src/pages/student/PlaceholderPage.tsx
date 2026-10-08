import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  phase?: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  icon: Icon,
  description = 'This module is scheduled in the upcoming build phase. All navigation links are verified and ready.',
  phase = 'Phase 4-7',
}) => {
  return (
    <div className="bg-campus-card border border-campus-border rounded-xl p-8 shadow-card flex flex-col items-center justify-center text-center py-16">
      <div className="w-12 h-12 rounded-xl bg-campus-sage-100 border border-campus-sage-200 flex items-center justify-center text-campus-jade-700 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[11px] font-semibold tracking-wider uppercase text-campus-jade-700 bg-campus-jade-50 px-2.5 py-0.5 rounded-full border border-campus-jade-200 mb-2">
        {phase}
      </span>
      <h1 className="text-xl font-bold text-campus-text tracking-tight mb-2">{title}</h1>
      <p className="text-xs text-campus-textMuted max-w-md leading-relaxed">{description}</p>
    </div>
  );
};
