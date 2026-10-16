import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, EmptyState, LoadingSkeleton } from '../../components/ui';
import { Clock, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: string;
  source: string;
  department?: string;
  semester?: number;
}

export const DeadlinesPage: React.FC = () => {
  const { showToast } = useToast();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    async function loadDeadlines() {
      setLoading(true);
      try {
        const url = selectedCategory === 'ALL' ? '/api/deadlines' : `/api/deadlines?category=${selectedCategory}`;
        const data = await apiRequest<Deadline[]>(url);
        setDeadlines(data);
      } catch (err: any) {
        showToast(err.message || 'Failed to load deadlines', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadDeadlines();
  }, [selectedCategory]);

  const categories = [
    { label: 'All Deadlines', value: 'ALL' },
    { label: 'Assignments', value: 'ASSIGNMENT' },
    { label: 'Applications', value: 'APPLICATION' },
    { label: 'Scholarships', value: 'SCHOLARSHIP' },
    { label: 'Registrations', value: 'REGISTRATION' },
    { label: 'Academic', value: 'ACADEMIC' },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Academic Deadlines"
        subtitle="Calculated countdowns and urgency status across all academic modules and submissions."
      />

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            active={selectedCategory === cat.value}
            onClick={() => setSelectedCategory(cat.value)}
          />
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : deadlines.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No active deadlines"
          description="You are all caught up on submissions for the selected category."
        />
      ) : (
        <div className="space-y-3">
          {deadlines.map((item) => {
            const now = dayjs();
            const due = dayjs(item.dueDate);
            const diffHours = due.diff(now, 'hour');
            const diffDays = due.diff(now, 'day');

            let urgencyVariant: 'jade' | 'amber' | 'blush' | 'neutral' = 'jade';
            let cardTint: 'default' | 'tint-1' | 'tint-2' | 'tint-3' | 'tint-4' = 'tint-1';
            let countdownLabel = `${diffDays} days remaining`;

            if (diffHours < 0) {
              urgencyVariant = 'neutral';
              cardTint = 'default';
              countdownLabel = 'Overdue';
            } else if (diffHours <= 24) {
              urgencyVariant = 'blush';
              cardTint = 'tint-4';
              countdownLabel = diffHours === 0 ? 'Due within the hour' : `${diffHours} hours remaining`;
            } else if (diffDays <= 3) {
              urgencyVariant = 'amber';
              cardTint = 'tint-3';
              countdownLabel = `${diffDays} days left`;
            }

            return (
              <Card
                key={item.id}
                tint={cardTint}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge label={item.category} variant="sage" />
                    <span className="text-xs text-campus-textDim">•</span>
                    <span className="text-xs text-campus-textMuted font-medium">{item.source}</span>
                  </div>
                  <h3 className="text-sm font-medium text-campus-text">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-campus-textMuted line-clamp-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <div className="text-[11px] text-campus-textDim flex items-center gap-1.5 pt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due on {due.format('dddd, D MMMM YYYY [at] h:mm A')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                  <Badge
                    label={countdownLabel}
                    variant={urgencyVariant}
                    icon={Clock}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
