import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { Calendar as CalendarIcon, MapPin, Clock, Tag, RefreshCw, ChevronRight, X } from 'lucide-react';
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

  const categories = ['ALL', 'ACADEMIC', 'CLUB', 'WORKSHOP', 'CAMPUS', 'COMPETITION'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">University Calendar</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">Academic sessions, workshops, club events, and competitions.</p>
        </div>
      </div>

      {/* Filter Tabs */}
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
            {cat === 'ALL' ? 'All Events' : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Loading events...</span>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="p-12 text-center bg-campus-card border border-campus-border rounded-xl">
          <CalendarIcon className="w-8 h-8 text-campus-textDim mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-campus-text">No events scheduled</p>
          <span className="text-[11px] text-campus-textMuted">Check back soon for new campus activities.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="space-y-2.5">
              <div className="text-xs font-bold text-campus-jade-700 uppercase tracking-wider px-1 flex items-center space-x-2">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{dateLabel}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setActiveModalEvent(ev)}
                    className="p-4 bg-campus-card border border-campus-border rounded-xl shadow-card hover:border-campus-sage-300 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900">
                          {ev.club?.name || ev.category}
                        </span>
                        <span className="text-[11px] text-campus-textDim flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{dayjs(ev.startTime).format('h:mm A')} - {dayjs(ev.endTime).format('h:mm A')}</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-campus-text mb-1 truncate">{ev.title}</h3>
                      <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-campus-borderSubtle flex items-center justify-between text-[11px] text-campus-textDim">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-campus-jade-700" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                      <span className="text-campus-jade-700 font-semibold flex items-center space-x-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-campus-card border border-campus-border rounded-xl max-w-lg w-full p-6 shadow-elevated relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModalEvent(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-campus-textDim hover:text-campus-text hover:bg-campus-surface"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900 inline-block mb-2">
              {activeModalEvent.club?.name || activeModalEvent.category}
            </span>
            <h2 className="text-lg font-bold text-campus-text mb-2">{activeModalEvent.title}</h2>
            <p className="text-xs text-campus-textMuted leading-relaxed whitespace-pre-line mb-4">{activeModalEvent.description}</p>

            <div className="p-3 bg-campus-surface rounded-lg space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between text-campus-text">
                <span className="text-campus-textDim">Date & Time</span>
                <span className="font-semibold">{dayjs(activeModalEvent.startTime).format('D MMMM YYYY, h:mm A')}</span>
              </div>
              <div className="flex items-center justify-between text-campus-text">
                <span className="text-campus-textDim">Location</span>
                <span className="font-semibold">{activeModalEvent.location}</span>
              </div>
              {activeModalEvent.organizer && (
                <div className="flex items-center justify-between text-campus-text">
                  <span className="text-campus-textDim">Organized By</span>
                  <span className="font-semibold">{activeModalEvent.organizer.fullName}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModalEvent(null)}
              className="w-full py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
