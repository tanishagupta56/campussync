import React, { useState } from 'react';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState } from '../../components/ui';
import { Flag, Plus, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';

interface IssueItem {
  id: string;
  issueCode: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export const CampusIssuesPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issues, setIssues] = useState<IssueItem[]>([
    {
      id: '1',
      issueCode: 'ISS-2026-0001',
      title: 'Hostel Block 3 Wi-Fi Gateway Outage',
      description: 'The router on 2nd floor west wing has been blinking amber since morning. High packet loss reported.',
      location: 'Hostel Block 3, 2nd Floor',
      category: 'IT_NETWORK',
      status: 'IN_PROGRESS',
      createdAt: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      id: '2',
      issueCode: 'ISS-2026-0002',
      title: 'Library 3rd Floor Water Dispenser Leak',
      description: 'Chilled water dispenser is leaking near the quiet reading hall desks. Maintenance requested.',
      location: 'Central Library, 3rd Floor',
      category: 'FACILITIES',
      status: 'REPORTED',
      createdAt: dayjs().subtract(3, 'hour').toISOString(),
    },
  ]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('FACILITIES');

  const filteredIssues = issues.filter((iss) => {
    if (selectedFilter === 'ALL') return true;
    return iss.status === selectedFilter;
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    const newIssue: IssueItem = {
      id: Date.now().toString(),
      issueCode: `ISS-2026-${String(issues.length + 1).padStart(4, '0')}`,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
    };

    setIssues([newIssue, ...issues]);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setLocation('');
  }

  const filters = [
    { label: 'All Issues', value: 'ALL' as const },
    { label: 'Reported', value: 'REPORTED' as const },
    { label: 'In Progress', value: 'IN_PROGRESS' as const },
    { label: 'Resolved', value: 'RESOLVED' as const },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Campus Issues"
        subtitle="Track reported infrastructure, maintenance, and facility tickets across the campus."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-campus-text text-white hover:bg-black shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Report Issue</span>
          </button>
        }
      />

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={selectedFilter === f.value}
            onClick={() => setSelectedFilter(f.value)}
          />
        ))}
      </div>

      {filteredIssues.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No issues found"
          description="There are currently no tickets matching the selected filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((iss, idx) => {
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = iss.status === 'REPORTED' ? 'tint-4' : tints[idx % tints.length];
            const badgeVariant: 'jade' | 'amber' | 'blush' =
              iss.status === 'RESOLVED' ? 'jade' : iss.status === 'IN_PROGRESS' ? 'amber' : 'blush';

            return (
              <Card key={iss.id} tint={tint} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Badge label={iss.issueCode} variant="sage" />
                      <Badge label={iss.status.replace('_', ' ')} variant={badgeVariant} />
                    </div>
                    <span className="text-[10px] text-campus-textDim">
                      {dayjs(iss.createdAt).format('MMM D, YYYY')}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-1">{iss.title}</h3>
                  <p className="text-xs text-campus-textMuted leading-relaxed mb-3 line-clamp-3">
                    {iss.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-campus-jade-700 flex-shrink-0" />
                    <span className="truncate">{iss.location}</span>
                  </span>
                  <Badge label={iss.category.replace('_', ' ')} variant="neutral" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Campus Issue"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-xs text-campus-textMuted mb-2">
            Submit a maintenance or facility ticket directly to the campus administration and estate office.
          </p>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Issue Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Broken Projector in Audi-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            >
              <option value="FACILITIES">Facilities & Estate</option>
              <option value="IT_NETWORK">IT & High-Speed Network</option>
              <option value="ELECTRICAL">Electrical & Lighting</option>
              <option value="SANITATION">Sanitation & Water</option>
              <option value="ACADEMIC_LAB">Laboratory Equipment</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Campus Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Academic Block B, Room 204"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Description & Details
            </label>
            <textarea
              rows={3}
              placeholder="Describe what is wrong and any urgency factors..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-medium text-campus-textMuted hover:text-campus-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
