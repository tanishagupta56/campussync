import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { Clock, AlertCircle, RefreshCw, CheckCircle2, Calendar } from 'lucide-react';
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

  const categories = ['ALL', 'ASSIGNMENT', 'APPLICATION', 'SCHOLARSHIP', 'REGISTRATION', 'ACADEMIC'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Academic & Submission Deadlines</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">Calculated countdowns and urgency status across all academic modules.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 bg-campus-card p-2 rounded-xl border border-campus-border">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-campus-jade-700 text-white'
                : 'text-campus-textMuted hover:text-campus-text hover:bg-campus-surface'
            }`}
          >
            {cat === 'ALL' ? 'All Deadlines' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Loading deadlines...</span>
        </div>
      ) : deadlines.length === 0 ? (
        <div className="p-12 text-center bg-campus-card border border-campus-border rounded-xl">
          <Clock className="w-8 h-8 text-campus-textDim mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-campus-text">No active deadlines</p>
          <span className="text-[11px] text-campus-textMuted">You are all caught up on submissions.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((item) => {
            const now = dayjs();
            const due = dayjs(item.dueDate);
            const diffHours = due.diff(now, 'hour');
            const diffDays = due.diff(now, 'day');

            let urgencyStyle = 'bg-campus-jade-50 text-campus-jade-700 border-campus-jade-200';
            let countdownLabel = `${diffDays} days remaining`;

            if (diffHours < 0) {
              urgencyStyle = 'bg-campus-surface text-campus-textDim border-campus-border';
              countdownLabel = 'Overdue';
            } else if (diffHours <= 24) {
              urgencyStyle = 'bg-campus-alert-redBg text-campus-alert-red border-campus-alert-redBorder font-bold';
              countdownLabel = diffHours === 0 ? 'Due within the hour' : `${diffHours} hours remaining`;
            } else if (diffDays <= 3) {
              urgencyStyle = 'bg-campus-alert-amberBg text-campus-alert-amber border-campus-alert-amberBorder font-semibold';
              countdownLabel = `${diffDays} days left`;
            }

            return (
              <div
                key={item.id}
                className="p-4 bg-campus-card border border-campus-border rounded-xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-campus-sage-300 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900">
                      {item.category}
                    </span>
                    <span className="text-xs text-campus-textDim">&bull;</span>
                    <span className="text-xs text-campus-textMuted font-medium">{item.source}</span>
                  </div>
                  <h3 className="text-sm font-bold text-campus-text">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-campus-textMuted line-clamp-1">{item.description}</p>
                  )}
                  <div className="text-[11px] text-campus-textDim flex items-center space-x-1 pt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>Due on {due.format('dddd, D MMMM YYYY [at] h:mm A')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0 self-start md:self-center">
                  <span className={`text-xs px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 ${urgencyStyle}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{countdownLabel}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
