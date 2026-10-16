import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, EmptyState } from '../../components/ui';
import {
  Bell,
  Search,
  ShieldCheck,
  RefreshCw,
  Building,
  GraduationCap,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  sourceCategory: 'ADMINISTRATION' | 'FACULTY' | 'CLUB';
  isVerifiedByAdmin: boolean;
  targetDepartment?: string;
  targetSemester?: number;
  createdAt: string;
  author: {
    fullName: string;
    role: string;
  };
}

export const AnnouncementsPage: React.FC = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        let endpoint = '/api/announcements';
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (selectedSource !== 'ALL') params.append('source', selectedSource);

        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }

        const data = await apiRequest<Announcement[]>(endpoint);
        setAnnouncements(data);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch announcements', 'error');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchAnnouncements();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSource]);

  return (
    <div className="py-2 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Campus Announcements"
        subtitle="Verified notices from university leadership, academic faculty, and student societies."
      />

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by title, department, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700 transition-all"
          />
        </div>

        {/* Pill Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          <Chip label="All" active={selectedSource === 'ALL'} onClick={() => setSelectedSource('ALL')} />
          <Chip
            label="Admin"
            icon={Building}
            active={selectedSource === 'ADMINISTRATION'}
            onClick={() => setSelectedSource('ADMINISTRATION')}
          />
          <Chip
            label="Faculty"
            icon={GraduationCap}
            active={selectedSource === 'FACULTY'}
            onClick={() => setSelectedSource('FACULTY')}
          />
          <Chip
            label="Clubs"
            icon={Users}
            active={selectedSource === 'CLUB'}
            onClick={() => setSelectedSource('CLUB')}
          />
        </div>
      </div>

      {/* Announcements 2-column Card Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted font-medium">Loading announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          description="Try broadening your search keywords or switching filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item, idx) => {
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = item.priority === 'HIGH' || item.priority === 'URGENT' ? 'tint-4' : tints[idx % tints.length];

            return (
              <Card key={item.id} tint={tint} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        label={item.sourceCategory}
                        variant={item.sourceCategory === 'ADMINISTRATION' ? 'sage' : 'jade'}
                      />
                      {item.isVerifiedByAdmin && (
                        <Badge label="Verified by Administration" variant="jade" icon={ShieldCheck} />
                      )}
                      {item.priority === 'URGENT' && (
                        <Badge label="Urgent" variant="blush" />
                      )}
                    </div>
                    <span className="text-[10px] text-campus-textDim">
                      {dayjs(item.createdAt).format('MMM D, YYYY')}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-campus-textMuted leading-relaxed whitespace-pre-line line-clamp-4">
                    {item.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                  <span>Author: {item.author?.fullName}</span>
                  {item.targetDepartment && <span>Dept: {item.targetDepartment}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
