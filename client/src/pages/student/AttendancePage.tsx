import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import dayjs from 'dayjs';

interface SubjectSummary {
  id: string;
  code: string;
  name: string;
  credits: number;
  facultyName?: string;
  attended: number;
  total: number;
  percentage: number;
  statusText: string;
  canMissCount: number;
  mustAttendCount: number;
}

interface AttendanceSummary {
  overallPercentage: number;
  totalClassesOverall: number;
  attendedClassesOverall: number;
  subjects: SubjectSummary[];
  alerts: any[];
}

interface TodayClass {
  slotId: string;
  subjectId: string;
  code: string;
  name: string;
  room: string;
  startTime: string;
  endTime: string;
  facultyName?: string;
  status: 'PRESENT' | 'ABSENT' | null;
}

export const AttendancePage: React.FC = () => {
  const { showToast } = useToast();

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Selected date for attendance logging (default today, limited to past 7 days)
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  async function loadData(dateToFetch = selectedDate) {
    try {
      const [sumRes, todayRes] = await Promise.all([
        apiRequest<AttendanceSummary>('/api/attendance/summary'),
        apiRequest<{ classes: TodayClass[] }>(`/api/attendance/today?date=${dateToFetch}`),
      ]);
      setSummary(sumRes);
      setClasses(todayRes.classes);
    } catch (err: any) {
      showToast(err.message || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  async function handleMarkAttendance(subjectId: string, status: 'PRESENT' | 'ABSENT') {
    setMarkingId(subjectId);
    try {
      const res = await apiRequest<{
        record: any;
        summary: AttendanceSummary;
        triggeredAlert: boolean;
        alertMessage?: string;
      }>('/api/attendance', {
        method: 'PUT',
        body: JSON.stringify({
          subjectId,
          date: selectedDate,
          status,
        }),
      });

      setSummary(res.summary);
      setClasses((prev) =>
        prev.map((c) => (c.subjectId === subjectId ? { ...c, status } : c))
      );

      if (res.triggeredAlert) {
        showToast(res.alertMessage || 'Warning: Attendance dropped below 80%!', 'warning');
      } else {
        showToast(`Marked ${status === 'PRESENT' ? 'Attended' : 'Missed'} for ${selectedDate}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update attendance', 'error');
    } finally {
      setMarkingId(null);
    }
  }

  // Calculate past 7 days list for date selector
  const pastDays = Array.from({ length: 8 }).map((_, i) => {
    const d = dayjs().subtract(i, 'day');
    return {
      formatted: d.format('YYYY-MM-DD'),
      display: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.format('ddd, D MMM'),
    };
  });

  const overall = summary?.overallPercentage ?? 100;
  const overallBadgeColor =
    overall >= 80 ? 'text-campus-jade-700 bg-campus-jade-50 border-campus-jade-200' :
    overall >= 75 ? 'text-campus-alert-amber bg-campus-alert-amberBg border-campus-alert-amberBorder' :
    'text-campus-alert-red bg-campus-alert-redBg border-campus-alert-redBorder';

  return (
    <div className="space-y-6">
      {/* Header with Overall Attendance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Attendance Tracker</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">
            Personal self-reported tracking against the minimum 80% university attendance policy.
          </p>
        </div>

        {summary && (
          <div className={`px-4 py-2 rounded-xl border flex items-center space-x-3 self-start md:self-auto ${overallBadgeColor}`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block">Overall Attendance</span>
              <span className="text-xl font-extrabold">{summary.overallPercentage}%</span>
            </div>
            <div className="text-[11px] font-medium opacity-80 border-l pl-3">
              {summary.attendedClassesOverall} / {summary.totalClassesOverall} Attended
            </div>
          </div>
        )}
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-campus-surface border border-campus-border rounded-xl flex items-center space-x-2.5 text-xs text-campus-textMuted">
        <Info className="w-4 h-4 text-campus-jade-700 flex-shrink-0" />
        <span>Attendance is self-reported and for personal tracking.</span>
      </div>

      {/* Date Switcher (Past 7 Days allowed, future rejected) */}
      <div className="bg-campus-card border border-campus-border rounded-xl p-3 shadow-card flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-campus-textDim whitespace-nowrap pl-1 pr-2">Date:</span>
        {pastDays.map((d) => (
          <button
            key={d.formatted}
            onClick={() => setSelectedDate(d.formatted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDate === d.formatted
                ? 'bg-campus-jade-700 text-white font-semibold shadow-xs'
                : 'text-campus-textMuted hover:bg-campus-surface hover:text-campus-text'
            }`}
          >
            {d.display}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Computing attendance records...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Classes Timetable Card */}
          <div className="bg-campus-card border border-campus-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-campus-jade-700" />
                <h2 className="text-sm font-bold text-campus-text">
                  Classes on {dayjs(selectedDate).format('dddd, D MMMM YYYY')}
                </h2>
              </div>
              <span className="text-[11px] text-campus-textDim">
                {classes.length} class{classes.length !== 1 ? 'es' : ''} scheduled
              </span>
            </div>

            {classes.length === 0 ? (
              <p className="text-xs text-campus-textMuted py-4 text-center">
                No scheduled lectures for this weekday.
              </p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => {
                  const isPresent = cls.status === 'PRESENT';
                  const isAbsent = cls.status === 'ABSENT';

                  return (
                    <div
                      key={cls.slotId}
                      className="p-3.5 bg-campus-surface rounded-xl border border-campus-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-campus-jade-700">{cls.code}</span>
                          <span className="text-xs text-campus-textDim">&bull;</span>
                          <span className="text-xs font-semibold text-campus-text">{cls.name}</span>
                        </div>
                        <div className="text-[11px] text-campus-textDim mt-0.5">
                          {cls.startTime} - {cls.endTime} &bull; Room {cls.room} {cls.facultyName ? `&bull; ${cls.facultyName}` : ''}
                        </div>
                      </div>

                      {/* Attended / Missed Buttons */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          disabled={markingId === cls.subjectId}
                          onClick={() => handleMarkAttendance(cls.subjectId, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                            isPresent
                              ? 'bg-campus-jade-700 text-white shadow-xs'
                              : 'bg-white border border-campus-border text-campus-text hover:bg-campus-jade-50 hover:text-campus-jade-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isPresent ? 'Attended' : 'Mark Attended'}</span>
                        </button>

                        <button
                          disabled={markingId === cls.subjectId}
                          onClick={() => handleMarkAttendance(cls.subjectId, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                            isAbsent
                              ? 'bg-campus-alert-red text-white shadow-xs'
                              : 'bg-white border border-campus-border text-campus-text hover:bg-campus-alert-redBg hover:text-campus-alert-red'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isAbsent ? 'Missed' : 'Mark Missed'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-Subject Status Cards */}
          <div>
            <h2 className="text-sm font-bold text-campus-text mb-3">Enrolled Course Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary?.subjects.map((sub) => {
                const isSafe = sub.percentage >= 80;
                const isBorderline = sub.percentage >= 75 && sub.percentage < 80;

                const cardColor =
                  isSafe ? 'border-campus-border' :
                  isBorderline ? 'border-campus-alert-amberBorder bg-campus-alert-amberBg/20' :
                  'border-campus-alert-redBorder bg-campus-alert-redBg/30';

                const progressColor =
                  isSafe ? 'bg-campus-jade-700' :
                  isBorderline ? 'bg-campus-alert-amber' :
                  'bg-campus-alert-red';

                return (
                  <div
                    key={sub.id}
                    className={`p-5 bg-campus-card rounded-xl border shadow-card flex flex-col justify-between ${cardColor}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900">
                          {sub.code}
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            isSafe ? 'text-campus-jade-700' :
                            isBorderline ? 'text-campus-alert-amber' :
                            'text-campus-alert-red'
                          }`}
                        >
                          {sub.percentage}%
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-campus-text mb-0.5">{sub.name}</h3>
                      <p className="text-[11px] text-campus-textDim mb-3">
                        {sub.attended} of {sub.total} classes attended {sub.facultyName ? `&bull; ${sub.facultyName}` : ''}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full bg-campus-borderSubtle h-2 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-campus-borderSubtle flex items-center justify-between text-xs">
                      <span className={`text-[11px] font-semibold ${isSafe ? 'text-campus-jade-700' : 'text-campus-alert-red'}`}>
                        {sub.statusText}
                      </span>
                      <span className="text-[10px] text-campus-textDim">Target: 80%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
