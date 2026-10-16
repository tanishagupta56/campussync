import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState } from '../../components/ui';
import {
  Users,
  Search,
  Calendar,
  Mail,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import dayjs from 'dayjs';

interface ClubItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  contactEmail: string;
  websiteUrl?: string;
  events: { id: string; title: string; startTime: string; location: string }[];
  members: { role: string; user: { fullName: string; email: string } }[];
}

export const ClubsPage: React.FC = () => {
  const { showToast } = useToast();

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeModalItem, setActiveModalItem] = useState<ClubItem | null>(null);

  async function loadClubs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      const res = await apiRequest<ClubItem[]>(`/api/clubs?${params.toString()}`);
      setClubs(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load clubs', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClubs();
  }, [selectedCategory, searchTerm]);

  const categories = [
    { label: 'All Societies', value: 'ALL' },
    { label: 'Technical', value: 'Technical' },
    { label: 'Cultural', value: 'Cultural' },
    { label: 'Engineering', value: 'Engineering' },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Student Clubs & Societies"
        subtitle="Explore active student technical teams, cultural societies, workshops, and recruitment notices."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700"
          />
        </div>

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
          <span className="text-xs text-campus-textMuted font-medium">Discovering campus societies...</span>
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs found"
          description="Try selecting another category or searching with different terms."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club, idx) => {
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = tints[idx % tints.length];
            const lead = club.members.find((m) => m.role === 'LEAD');

            return (
              <Card
                key={club.id}
                tint={tint}
                onClick={() => setActiveModalItem(club)}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge label={club.category} variant="jade" />
                    {lead && (
                      <span className="text-[10px] text-campus-textDim">
                        Lead: {lead.user.fullName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-1 leading-snug">{club.name}</h3>
                  <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed mb-3">
                    {club.description}
                  </p>

                  {/* Upcoming events pill */}
                  {club.events && club.events.length > 0 && (
                    <div className="bg-white/70 rounded-xl p-2.5 mb-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-campus-jade-700 tracking-wider">
                        Next Meet / Workshop
                      </span>
                      <p className="text-xs font-semibold text-campus-text truncate">
                        {club.events[0].title}
                      </p>
                      <div className="text-[10px] text-campus-textDim flex items-center gap-2">
                        <span>{dayjs(club.events[0].startTime).format('D MMM, h:mm A')}</span>
                        <span>&bull;</span>
                        <span>{club.events[0].location}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-campus-jade-700" />
                    <span className="truncate">{club.contactEmail}</span>
                  </div>

                  <span className="font-semibold text-campus-jade-700 hover:underline">
                    View Details &bull;
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Club Details Modal */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          title={activeModalItem.name}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge label={activeModalItem.category} variant="jade" />
              <div className="text-right text-xs text-campus-textDim">
                {activeModalItem.members.length} Core Members
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-campus-text">About the Society:</span>
              <p className="text-xs text-campus-textMuted leading-relaxed mt-1">
                {activeModalItem.description}
              </p>
            </div>

            <div className="p-3 bg-campus-surface rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-campus-textDim">Official Contact:</span>
                <span className="font-semibold text-campus-text">{activeModalItem.contactEmail}</span>
              </div>
              {activeModalItem.websiteUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-campus-textDim">Society Portal:</span>
                  <a
                    href={activeModalItem.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-campus-jade-700 hover:underline flex items-center gap-1"
                  >
                    <span>Visit website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Upcoming Activities */}
            {activeModalItem.events && activeModalItem.events.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-campus-text mb-2 block">
                  Scheduled Events & Workshops:
                </span>
                <div className="space-y-2">
                  {activeModalItem.events.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-white border border-campus-border rounded-xl text-xs">
                      <div className="font-medium text-campus-text">{ev.title}</div>
                      <div className="text-[10px] text-campus-textDim mt-0.5 flex justify-between">
                        <span>{dayjs(ev.startTime).format('D MMM YYYY, h:mm A')}</span>
                        <span>{ev.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-5 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-semibold hover:bg-campus-jade-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
