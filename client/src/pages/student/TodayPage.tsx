import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import {
  Clock,
  Calendar as CalendarIcon,
  Bell,
  Book,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  sourceCategory: 'ADMINISTRATION' | 'FACULTY' | 'CLUB';
  isVerifiedByAdmin: boolean;
  createdAt: string;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  source: string;
}

interface EventItem {
  id: string;
  title: string;
  category: string;
  location: string;
  startTime: string;
  club?: { name: string };
}

interface LibraryData {
  capacity: number;
  occupied: number;
  available: number;
  occupancyPercentage: number;
  lastUpdated: string;
}

interface AttendanceAlert {
  id: string;
  subjectId: string;
  threshold: number;
  percentageAtAlert: number;
  subject: { name: string; code: string };
}

export const TodayPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentHour = dayjs().hour();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    timeGreeting = 'Good evening';
  }

  const currentDateFormatted = dayjs().format('dddd, D MMMM YYYY');

  useEffect(() => {
    async function loadTodayData() {
      setLoading(true);
      setError(null);
      try {
        const [annRes, deadRes, evRes, libRes, attRes] = await Promise.all([
          apiRequest<Announcement[]>('/api/announcements'),
          apiRequest<Deadline[]>('/api/deadlines?upcoming=true'),
          apiRequest<EventItem[]>('/api/events?upcoming=true'),
          apiRequest<LibraryData>('/api/library'),
          apiRequest<{ alerts: AttendanceAlert[] }>('/api/attendance/summary'),
        ]);

        setAnnouncements(annRes.slice(0, 3));
        setDeadlines(deadRes.slice(0, 4));
        setEvents(evRes.slice(0, 3));
        setLibrary(libRes);
        setAlerts(attRes.alerts || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadTodayData();
  }, []);

  async function dismissAlert(id: string) {
    try {
      await apiRequest(`/api/attendance/alerts/${id}/dismiss`, { method: 'PATCH' });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast('Attendance warning banner dismissed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to dismiss alert', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Attendance Alert Dismissible Banner if below 80% */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="p-4 bg-campus-alert-redBg border border-campus-alert-redBorder rounded-xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-campus-alert-red flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-campus-alert-red">
                    Low Attendance Warning: {al.subject.name} ({al.subject.code})
                  </h3>
                  <p className="text-xs text-campus-textMuted mt-0.5">
                    Your attendance has fallen to <strong>{al.percentageAtAlert}%</strong>, below the required 80% threshold. You must attend upcoming classes to be eligible for end-semester exams.
                  </p>
                  <Link
                    to="/attendance"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-campus-alert-red hover:underline mt-1.5"
                  >
                    <span>Open Attendance Tracker</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <button
                onClick={() => dismissAlert(al.id)}
                className="p-1 rounded-lg text-campus-textDim hover:text-campus-text hover:bg-campus-alert-redBorder/30"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-campus-text">
            {timeGreeting}, {user?.fullName?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs font-medium text-campus-textMuted mt-0.5">
            {currentDateFormatted} &bull; {user?.studentProfile?.branch || 'Campus Portal'}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            to="/attendance"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-campus-jade-700 text-white font-medium hover:bg-campus-jade-800 transition-colors shadow-xs"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Syncing campus services...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-campus-alert-redBg border border-campus-alert-redBorder rounded-xl text-xs text-campus-alert-red">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Library Capacity Snapshot Card */}
            {library && (
              <div className="bg-campus-card border border-campus-border rounded-xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-campus-sage-100 rounded-lg text-campus-jade-700">
                      <Book className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-campus-text">Central Library Availability</h2>
                      <span className="text-[11px] text-campus-textDim">Real-time seating monitor</span>
                    </div>
                  </div>
                  <Link
                    to="/library"
                    className="text-xs text-campus-jade-700 font-medium hover:underline flex items-center space-x-1"
                  >
                    <span>View Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="p-3 bg-campus-surface rounded-lg">
                    <span className="text-[10px] text-campus-textDim uppercase font-semibold">Available</span>
                    <p className="text-xl font-bold text-campus-jade-700 mt-0.5">{library.available}</p>
                  </div>
                  <div className="p-3 bg-campus-surface rounded-lg">
                    <span className="text-[10px] text-campus-textDim uppercase font-semibold">Occupied</span>
                    <p className="text-xl font-bold text-campus-text mt-0.5">{library.occupied}</p>
                  </div>
                  <div className="p-3 bg-campus-surface rounded-lg">
                    <span className="text-[10px] text-campus-textDim uppercase font-semibold">Capacity</span>
                    <p className="text-xl font-bold text-campus-text mt-0.5">{library.capacity}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-campus-textMuted">
                    <span>Occupancy Rate</span>
                    <span className="font-semibold">{library.occupancyPercentage}%</span>
                  </div>
                  <div className="w-full bg-campus-borderSubtle h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        library.occupancyPercentage > 85
                          ? 'bg-campus-alert-red'
                          : library.occupancyPercentage > 60
                          ? 'bg-campus-alert-amber'
                          : 'bg-campus-jade-700'
                      }`}
                      style={{ width: `${library.occupancyPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Announcements */}
            <div className="bg-campus-card border border-campus-border rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-campus-jade-700" />
                  <h2 className="text-sm font-bold text-campus-text">Important Announcements</h2>
                </div>
                <Link
                  to="/announcements"
                  className="text-xs text-campus-jade-700 font-medium hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-campus-textMuted py-4 text-center">No announcements at this time.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-campus-surface rounded-lg border border-campus-borderSubtle hover:border-campus-sage-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-xs font-bold text-campus-text truncate">{item.title}</h3>
                        {item.isVerifiedByAdmin && (
                          <span className="flex-shrink-0 inline-flex items-center space-x-1 text-[10px] font-semibold text-campus-jade-700 bg-campus-jade-50 px-2 py-0.5 rounded-full border border-campus-jade-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-campus-textDim">
                        <span className="uppercase font-semibold tracking-wider">{item.sourceCategory}</span>
                        <span>{dayjs(item.createdAt).format('MMM D, YYYY')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Deadlines */}
            <div className="bg-campus-card border border-campus-border rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-campus-jade-700" />
                  <h2 className="text-sm font-bold text-campus-text">Deadlines</h2>
                </div>
                <Link to="/deadlines" className="text-xs text-campus-jade-700 hover:underline">
                  All
                </Link>
              </div>

              {deadlines.length === 0 ? (
                <p className="text-xs text-campus-textMuted py-4 text-center">No upcoming deadlines.</p>
              ) : (
                <div className="space-y-2.5">
                  {deadlines.map((item) => {
                    const daysLeft = dayjs(item.dueDate).diff(dayjs(), 'day');
                    const isUrgent = daysLeft <= 2;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-campus-surface rounded-lg border border-campus-borderSubtle flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-campus-text truncate">{item.title}</p>
                          <span className="text-[10px] text-campus-textDim block mt-0.5">{item.source}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full block ${
                              isUrgent
                                ? 'bg-campus-alert-redBg text-campus-alert-red border border-campus-alert-redBorder'
                                : 'bg-campus-sage-100 text-campus-sage-900'
                            }`}
                          >
                            {daysLeft <= 0 ? 'Due Today' : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Events */}
            <div className="bg-campus-card border border-campus-border rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-campus-jade-700" />
                  <h2 className="text-sm font-bold text-campus-text">Events</h2>
                </div>
                <Link to="/calendar" className="text-xs text-campus-jade-700 hover:underline">
                  Calendar
                </Link>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-campus-textMuted py-4 text-center">No upcoming events.</p>
              ) : (
                <div className="space-y-2.5">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-campus-surface rounded-lg border border-campus-borderSubtle"
                    >
                      <span className="text-[10px] font-semibold text-campus-jade-700 uppercase tracking-wider block">
                        {ev.club?.name || ev.category}
                      </span>
                      <p className="text-xs font-semibold text-campus-text mt-0.5 truncate">{ev.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-campus-textDim mt-1">
                        <span>{ev.location}</span>
                        <span>{dayjs(ev.startTime).format('D MMM, h:mm A')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
