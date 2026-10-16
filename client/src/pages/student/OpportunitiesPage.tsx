import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState } from '../../components/ui';
import {
  Zap,
  Search,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
  RefreshCw,
  Award,
} from 'lucide-react';
import dayjs from 'dayjs';

interface OpportunityItem {
  id: string;
  name: string;
  organization: string;
  category: 'INTERNSHIP' | 'HACKATHON' | 'COMPETITION' | 'WORKSHOP' | 'FELLOWSHIP' | 'RESEARCH';
  description: string;
  eligibility: string;
  deadline: string;
  applicationLink: string;
  stipend?: string;
  branch?: string;
  isSaved: boolean;
  applicationStatus: 'SAVED' | 'APPLIED' | null;
}

export const OpportunitiesPage: React.FC = () => {
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeModalItem, setActiveModalItem] = useState<OpportunityItem | null>(null);

  async function loadOpportunities() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      const res = await apiRequest<OpportunityItem[]>(`/api/opportunities?${params.toString()}`);
      setOpportunities(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, [selectedCategory, searchTerm]);

  async function handleToggleSave(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await apiRequest<{ success: boolean; isSaved: boolean; status: string | null }>(
        `/api/opportunities/${id}/save`,
        { method: 'POST' }
      );
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, isSaved: res.isSaved, applicationStatus: res.status as any } : op))
      );
      showToast(res.isSaved ? 'Opportunity bookmarked' : 'Removed from bookmarks', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update bookmark', 'error');
    }
  }

  async function handleToggleApplied(id: string, currentStatus: string | null, e: React.MouseEvent) {
    e.stopPropagation();
    const nextStatus = currentStatus === 'APPLIED' ? 'SAVED' : 'APPLIED';
    try {
      await apiRequest(`/api/opportunities/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, isSaved: true, applicationStatus: nextStatus } : op))
      );
      showToast(nextStatus === 'APPLIED' ? 'Marked as Applied!' : 'Application status reset', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  }

  const categories = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Internships', value: 'INTERNSHIP' },
    { label: 'Hackathons', value: 'HACKATHON' },
    { label: 'Competitions', value: 'COMPETITION' },
    { label: 'Workshops', value: 'WORKSHOP' },
    { label: 'Fellowships', value: 'FELLOWSHIP' },
    { label: 'Research', value: 'RESEARCH' },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Opportunities & Competitions"
        subtitle="Verified internships, nationwide hackathons, open research fellowships, and developer competitions."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by opportunity, company, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {categories.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              active={selectedCategory === c.value}
              onClick={() => setSelectedCategory(c.value)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted font-medium">Finding opportunities...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No opportunities found"
          description="Try broadening your search term or category filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((op, idx) => {
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = tints[idx % tints.length];
            const isApplied = op.applicationStatus === 'APPLIED';
            const daysLeft = dayjs(op.deadline).diff(dayjs(), 'day');

            return (
              <Card
                key={op.id}
                tint={tint}
                onClick={() => setActiveModalItem(op)}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge label={op.category} variant="sage" />
                      {op.stipend && (
                        <span className="text-[11px] font-bold text-campus-jade-700">
                          {op.stipend}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleApplied(op.id, op.applicationStatus, e)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1 ${
                          isApplied
                            ? 'bg-campus-jade-700 text-white shadow-xs'
                            : 'bg-white/80 text-campus-textDim hover:text-campus-text'
                        }`}
                        title={isApplied ? 'Application submitted' : 'Click to mark as applied'}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isApplied ? 'Applied' : 'Mark Applied'}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleSave(op.id, e)}
                        className={`p-1.5 rounded-full transition-colors ${
                          op.isSaved ? 'text-campus-jade-700 bg-white' : 'text-campus-textDim hover:text-campus-text'
                        }`}
                        title={op.isSaved ? 'Saved' : 'Save opportunity'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${op.isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-0.5 leading-snug">{op.name}</h3>
                  <p className="text-[11px] font-medium text-campus-textDim mb-2 flex items-center gap-1">
                    <Building className="w-3 h-3 text-campus-jade-700" />
                    <span>{op.organization}</span>
                  </p>
                  <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed mb-3">
                    {op.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-campus-jade-700" />
                    <span>Deadline: {dayjs(op.deadline).format('D MMM YYYY')} ({daysLeft}d left)</span>
                  </div>

                  <a
                    href={op.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 font-semibold text-campus-jade-700 hover:underline"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Opportunity Details Modal */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          title={activeModalItem.name}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-campus-textDim">Organized by:</span>
                <p className="text-sm font-semibold text-campus-text">{activeModalItem.organization}</p>
              </div>
              {activeModalItem.stipend && (
                <div className="text-right">
                  <span className="text-xs text-campus-textDim">Prize / Stipend:</span>
                  <p className="text-base font-bold text-campus-jade-700">{activeModalItem.stipend}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-campus-surface rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-semibold text-campus-text">Eligibility Requirements:</span>
                <p className="text-campus-textMuted mt-0.5">{activeModalItem.eligibility}</p>
              </div>
              <div className="pt-2 border-t border-black/5">
                <span className="font-semibold text-campus-text">Application Deadline:</span>
                <p className="text-campus-textMuted mt-0.5">
                  {dayjs(activeModalItem.deadline).format('dddd, D MMMM YYYY')}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-campus-text">Program Overview:</span>
              <p className="text-xs text-campus-textMuted leading-relaxed mt-1">
                {activeModalItem.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-campus-textMuted hover:bg-campus-surface"
              >
                Close
              </button>
              <a
                href={activeModalItem.applicationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-semibold hover:bg-campus-jade-800"
              >
                <span>Apply on Official Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
