import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  Search,
  Filter,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Campus Announcements</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">
            Verified updates from university administration, academic departments, and student clubs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-campus-card border border-campus-border rounded-xl p-4 shadow-card flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search announcements by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs text-campus-text placeholder:text-campus-textDim focus:bg-white focus:border-campus-jade-700 transition-colors"
          />
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center space-x-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All Sources', value: 'ALL' },
            { label: 'Administration', value: 'ADMINISTRATION' },
            { label: 'Faculty', value: 'FACULTY' },
            { label: 'Clubs', value: 'CLUB' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedSource(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSource === tab.value
                  ? 'bg-campus-jade-700 text-white'
                  : 'bg-campus-surface text-campus-textMuted hover:text-campus-text hover:bg-campus-borderSubtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Loading announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-campus-card border border-campus-border rounded-xl">
          <Bell className="w-8 h-8 text-campus-textDim mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-campus-text">No announcements found</p>
          <span className="text-[11px] text-campus-textMuted">Try refining your search terms or filter selection.</span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {announcements.map((item) => {
            const isHighPriority = item.priority === 'HIGH' || item.priority === 'URGENT';

            return (
              <div
                key={item.id}
                className="p-5 bg-campus-card border border-campus-border rounded-xl shadow-card hover:border-campus-sage-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {/* Source Category Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        item.sourceCategory === 'ADMINISTRATION'
                          ? 'bg-campus-sage-100 text-campus-sage-900 border border-campus-sage-200'
                          : item.sourceCategory === 'FACULTY'
                          ? 'bg-campus-jade-50 text-campus-jade-700 border border-campus-jade-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.sourceCategory === 'ADMINISTRATION' && <Building className="w-3 h-3" />}
                      {item.sourceCategory === 'FACULTY' && <GraduationCap className="w-3 h-3" />}
                      {item.sourceCategory === 'CLUB' && <Users className="w-3 h-3" />}
                      <span>{item.sourceCategory}</span>
                    </span>

                    {/* Verified by Administration badge — strictly if isVerifiedByAdmin is true */}
                    {item.isVerifiedByAdmin && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-campus-jade-700 bg-campus-jade-50 px-2.5 py-0.5 rounded-full border border-campus-jade-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified by Administration</span>
                      </span>
                    )}

                    {isHighPriority && (
                      <span className="text-[10px] font-bold text-campus-alert-red bg-campus-alert-redBg px-2 py-0.5 rounded-full border border-campus-alert-redBorder">
                        {item.priority}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-campus-textDim">
                    {dayjs(item.createdAt).format('MMMM D, YYYY')}
                  </span>
                </div>

                <h2 className="text-sm font-bold text-campus-text mb-2 tracking-tight">
                  {item.title}
                </h2>

                <p className="text-xs text-campus-textMuted leading-relaxed whitespace-pre-line mb-3">
                  {item.content}
                </p>

                <div className="pt-2.5 border-t border-campus-borderSubtle flex items-center justify-between text-[11px] text-campus-textDim">
                  <span>Author: {item.author?.fullName}</span>
                  {item.targetDepartment && (
                    <span>Target: {item.targetDepartment}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
