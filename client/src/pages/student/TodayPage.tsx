import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import { PageHeader, Card, Badge, ProgressBar, MiniBarChart, Chip, EmptyState } from '../../components/ui';
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
  Sparkles,
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

interface AttendanceSummary {
  overallPercentage: number;
  totalClassesOverall: number;
  attendedClassesOverall: number;
  subjects: { code: string; name: string; percentage: number }[];
  alerts: AttendanceAlert[];
}

export const TodayPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState<'all' | 'academic' | 'events' | 'deadlines'>('all');

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
      try {
        const [annRes, deadRes, evRes, libRes, attRes] = await Promise.all([
          apiRequest<Announcement[]>('/api/announcements'),
          apiRequest<Deadline[]>('/api/deadlines?upcoming=true'),
          apiRequest<EventItem[]>('/api/events?upcoming=true'),
          apiRequest<LibraryData>('/api/library'),
          apiRequest<AttendanceSummary>('/api/attendance/summary'),
        ]);

        setAnnouncements(annRes.slice(0, 4));
        setDeadlines(deadRes.slice(0, 4));
        setEvents(evRes.slice(0, 4));
        setLibrary(libRes);
        setAttendance(attRes);
        setAlerts(attRes.alerts || []);
      } catch (err: any) {
        showToast('Could not load today’s updates', 'error');
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

  // Right Panel contents for Today
  const RightPanelContent = (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card tint="tint-1" className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-campus-jade-700 text-white font-medium flex items-center justify-center text-sm shadow-xs">
            {user?.fullName
              ? user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
              : 'ST'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-campus-text truncate">{user?.fullName}</h2>
            <p className="text-[11px] text-campus-textMuted truncate">
              {user?.studentProfile?.program || 'B.Tech'} &bull; Sem {user?.studentProfile?.semester || 3}
            </p>
            <p className="text-[10px] text-campus-textDim truncate">{user?.studentProfile?.branch}</p>
          </div>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/5">
          <div className="bg-white/70 rounded-[14px] p-2.5 text-center">
            <div className="text-[10px] uppercase font-semibold text-campus-textDim">Attendance</div>
            <div className="text-lg font-bold text-campus-jade-700 mt-0.5">
              {attendance ? `${attendance.overallPercentage}%` : '--'}
            </div>
          </div>
          <div className="bg-white/70 rounded-[14px] p-2.5 text-center">
            <div className="text-[10px] uppercase font-semibold text-campus-textDim">Deadlines</div>
            <div className="text-lg font-bold text-campus-text mt-0.5">{deadlines.length} Due</div>
          </div>
        </div>
      </Card>

      {/* Attendance Activity Mini Bar Chart */}
      {attendance && attendance.subjects.length > 0 ? (
        <Card tint="default" className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-campus-text">Attendance activity</span>
            <Link to="/attendance" className="text-[10px] font-semibold text-campus-jade-700 hover:underline">
              Details
            </Link>
          </div>
          <MiniBarChart
            data={attendance.subjects.slice(0, 4).map((s) => ({
              label: s.code,
              value: s.percentage,
            }))}
            targetValue={80}
          />
        </Card>
      ) : (
        <Card tint="default" className="p-4 text-center">
          <span className="text-xs font-semibold text-campus-text block mb-1">Attendance activity</span>
          <p className="text-[11px] text-campus-textMuted">No attendance recorded yet.</p>
          <Link to="/attendance" className="inline-block mt-2 text-[11px] font-semibold text-campus-jade-700 hover:underline">
            Mark attendance &rarr;
          </Link>
        </Card>
      )}

      {/* Library Snapshot Card */}
      {library && (
        <Card tint="tint-2" className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Book className="w-3.5 h-3.5 text-campus-jade-700" />
              <span className="text-xs font-semibold text-campus-text">Library Seating</span>
            </div>
            <span className="text-[10px] font-bold text-campus-jade-700">
              {library.available} free
            </span>
          </div>
          <ProgressBar
            percentage={library.occupancyPercentage}
            label={`${library.occupied} of ${library.capacity} seats occupied`}
            variant={library.occupancyPercentage > 85 ? 'blush' : library.occupancyPercentage > 60 ? 'amber' : 'jade'}
          />
        </Card>
      )}

      {/* Next Up (Next 3 deadlines or events) */}
      <Card tint="tint-3" className="p-4">
        <div className="text-xs font-semibold text-campus-text mb-2.5">Next up</div>
        <div className="space-y-2">
          {deadlines.slice(0, 2).map((d) => (
            <div key={d.id} className="text-xs bg-white/80 rounded-xl p-2.5">
              <div className="font-medium text-campus-text truncate">{d.title}</div>
              <div className="text-[10px] text-campus-textDim mt-0.5 flex justify-between">
                <span>{d.category}</span>
                <span>{dayjs(d.dueDate).format('MMM D')}</span>
              </div>
            </div>
          ))}
          {events.slice(0, 1).map((ev) => (
            <div key={ev.id} className="text-xs bg-white/80 rounded-xl p-2.5">
              <div className="font-medium text-campus-text truncate">{ev.title}</div>
              <div className="text-[10px] text-campus-textDim mt-0.5 flex justify-between">
                <span>{ev.location}</span>
                <span>{dayjs(ev.startTime).format('h:mm A')}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 py-2">
      <div className="flex-1 min-w-0">
        {/* Attendance Alert Dismissible Banner */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-4 bg-[var(--card-tint-4)] rounded-[20px] shadow-subtle flex items-start justify-between gap-3 animate-in fade-in"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-campus-alert-red flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-campus-alert-red">
                      Attendance Alert: {al.subject.name} ({al.subject.code})
                    </h3>
                    <p className="text-xs text-campus-textMuted mt-0.5">
                      Attendance is currently at <strong>{al.percentageAtAlert}%</strong> (target 80%).
                    </p>
                    <Link
                      to="/attendance"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-campus-alert-red hover:underline mt-1"
                    >
                      <span>View Attendance</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => dismissAlert(al.id)}
                  className="p-1 rounded-full text-campus-textDim hover:text-campus-text"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Page Header (Large 40px light font) */}
        <PageHeader
          title={`${timeGreeting}, ${user?.fullName?.split(' ')[0] || 'Student'}`}
          subtitle={`${currentDateFormatted} • CampusSync Dashboard`}
          actions={
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-medium hover:bg-campus-jade-800 transition-all shadow-xs"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Mark Attendance</span>
            </Link>
          }
        />

        {/* Pill Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <Chip label="All updates" active={activeChip === 'all'} onClick={() => setActiveChip('all')} />
          <Chip label="Announcements" active={activeChip === 'academic'} onClick={() => setActiveChip('academic')} />
          <Chip label="Deadlines" active={activeChip === 'deadlines'} onClick={() => setActiveChip('deadlines')} />
          <Chip label="Events" active={activeChip === 'events'} onClick={() => setActiveChip('events')} />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
            <span className="text-xs text-campus-textMuted font-medium">Syncing campus services...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Announcements Grid */}
            {(activeChip === 'all' || activeChip === 'academic') && (
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-campus-textDim mb-3 px-1">
                  Important Announcements
                </div>

                {announcements.length === 0 ? (
                  <Card tint="default" className="p-6 text-center">
                    <EmptyState
                      icon={Bell}
                      title="No announcements yet"
                      description="You are all caught up! Announcements from administration and your department will appear here."
                    />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {announcements.map((item, idx) => {
                      const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
                      const tint = tints[idx % tints.length];
                      return (
                        <Card key={item.id} tint={tint} className="flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                label={item.sourceCategory}
                                variant={item.sourceCategory === 'ADMINISTRATION' ? 'sage' : 'jade'}
                              />
                              {item.isVerifiedByAdmin ? (
                                <Badge label="Verified" variant="jade" icon={ShieldCheck} />
                              ) : (
                                <span className="text-[10px] text-campus-textDim">
                                  {dayjs(item.createdAt).format('MMM D')}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-medium text-campus-text mb-1 leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed">
                              {item.content}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                            <span>{dayjs(item.createdAt).format('D MMMM YYYY')}</span>
                            <Link
                              to="/announcements"
                              className="font-medium text-campus-jade-700 hover:underline flex items-center gap-0.5"
                            >
                              <span>Read</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Deadlines & Events */}
            {(activeChip === 'all' || activeChip === 'deadlines' || activeChip === 'events') && (
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-campus-textDim mb-3 px-1">
                  Upcoming Deadlines & Sessions
                </div>

                {deadlines.length === 0 && events.length === 0 ? (
                  <Card tint="default" className="p-6 text-center">
                    <EmptyState
                      icon={Clock}
                      title="No upcoming deadlines or sessions"
                      description="You have no pending deadlines or scheduled lecture sessions for your enrolled subjects."
                    />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deadlines.map((dl) => {
                      const daysLeft = dayjs(dl.dueDate).diff(dayjs(), 'day');
                      const isUrgent = daysLeft <= 2;
                      return (
                        <Card key={dl.id} tint={isUrgent ? 'tint-4' : 'tint-3'}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge label={dl.category} variant="neutral" />
                            <Badge
                              label={daysLeft <= 0 ? 'Due Today' : `${daysLeft}d left`}
                              variant={isUrgent ? 'blush' : 'amber'}
                            />
                          </div>
                          <h4 className="text-sm font-medium text-campus-text mb-1">{dl.title}</h4>
                          <div className="text-[11px] text-campus-textDim flex items-center gap-1.5 mt-2">
                            <Clock className="w-3 h-3 text-campus-jade-700" />
                            <span>Due {dayjs(dl.dueDate).format('ddd, D MMM • h:mm A')}</span>
                          </div>
                        </Card>
                      );
                    })}

                    {events.map((ev) => (
                      <Card key={ev.id} tint="tint-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge label={ev.club?.name || ev.category} variant="jade" />
                          <span className="text-[10px] text-campus-textDim">
                            {dayjs(ev.startTime).format('MMM D')}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-campus-text mb-1">{ev.title}</h4>
                        <div className="text-[11px] text-campus-textDim flex items-center gap-1.5 mt-2">
                          <CalendarIcon className="w-3 h-3 text-campus-jade-700" />
                          <span>{ev.location} &bull; {dayjs(ev.startTime).format('h:mm A')}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Info Panel (Desktop 320px, hidden below 1200px) */}
      <div className="hidden xl:block w-[320px] flex-shrink-0">
        {RightPanelContent}
      </div>
    </div>
  );
};
