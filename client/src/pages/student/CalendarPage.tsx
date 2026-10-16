import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState, LoadingSkeleton } from '../../components/ui';
import { Calendar as CalendarIcon, MapPin, Clock, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  club?: { name: string; category: string };
  organizer?: { fullName: string; role: string };
}

export const CalendarPage: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const url = selectedCategory === 'ALL' ? '/api/events' : `/api/events?category=${selectedCategory}`;
        const data = await apiRequest<EventItem[]>(url);
        setEvents(data);
      } catch (err: any) {
        showToast(err.message || 'Failed to load events', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [selectedCategory]);

  // Group events by date string (e.g. "Monday, 12 Oct 2026")
  const grouped = events.reduce((acc: Record<string, EventItem[]>, ev) => {
    const dateKey = dayjs(ev.startTime).format('dddd, D MMMM YYYY');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {});

  const categories = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Academic', value: 'ACADEMIC' },
    { label: 'Clubs', value: 'CLUB' },
    { label: 'Workshops', value: 'WORKSHOP' },
    { label: 'Campus', value: 'CAMPUS' },
    { label: 'Competitions', value: 'COMPETITION' },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="University Calendar"
        subtitle="Academic sessions, workshops, club events, and competitions across campus."
      />

      {/* Filter Chips */}
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
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No events scheduled"
          description="Check back soon for new campus activities or try choosing another category filter."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="text-xs font-semibold text-campus-jade-700 uppercase tracking-wider px-1 flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{dateLabel}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayEvents.map((ev, idx) => {
                  const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
                  const tint = tints[idx % tints.length];

                  return (
                    <Card
                      key={ev.id}
                      tint={tint}
                      onClick={() => setActiveModalEvent(ev)}
                      className="flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <Badge
                            label={ev.club?.name || ev.category}
                            variant={ev.category === 'ACADEMIC' ? 'sage' : 'jade'}
                          />
                          <span className="text-[11px] text-campus-textDim flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>
                              {dayjs(ev.startTime).format('h:mm A')} - {dayjs(ev.endTime).format('h:mm A')}
                            </span>
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-campus-text mb-1 truncate">{ev.title}</h3>
                        <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed">{ev.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-campus-jade-700" />
                          <span className="truncate">{ev.location}</span>
                        </span>
                        <span className="text-campus-jade-700 font-semibold flex items-center gap-0.5">
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={!!activeModalEvent}
        onClose={() => setActiveModalEvent(null)}
        title="Event Details"
      >
        {activeModalEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                label={activeModalEvent.club?.name || activeModalEvent.category}
                variant={activeModalEvent.category === 'ACADEMIC' ? 'sage' : 'jade'}
              />
            </div>
            <h2 className="text-lg font-medium text-campus-text">{activeModalEvent.title}</h2>
            <p className="text-xs text-campus-textMuted leading-relaxed whitespace-pre-line">
              {activeModalEvent.description}
            </p>

            <div className="p-3.5 bg-campus-surface rounded-[16px] space-y-2 text-xs">
              <div className="flex items-center justify-between text-campus-text">
                <span className="text-campus-textDim">Date & Time</span>
                <span className="font-medium">
                  {dayjs(activeModalEvent.startTime).format('D MMMM YYYY, h:mm A')}
                </span>
              </div>
              <div className="flex items-center justify-between text-campus-text">
                <span className="text-campus-textDim">Location</span>
                <span className="font-medium">{activeModalEvent.location}</span>
              </div>
              {activeModalEvent.organizer && (
                <div className="flex items-center justify-between text-campus-text">
                  <span className="text-campus-textDim">Organized By</span>
                  <span className="font-medium">{activeModalEvent.organizer.fullName}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModalEvent(null)}
              className="w-full py-2.5 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
