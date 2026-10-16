import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, ProgressBar, LoadingSkeleton } from '../../components/ui';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
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
  const overallBadgeVariant: 'jade' | 'amber' | 'blush' =
    overall >= 80 ? 'jade' :
    overall >= 75 ? 'amber' :
    'blush';

  return (
    <div className="py-2 space-y-6">
      {/* Header with Overall Attendance Pill */}
      <PageHeader
        title="Attendance Tracker"
        subtitle="Personal self-reported tracking against the minimum 80% university attendance policy."
        actions={
          summary ? (
            <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-2xl shadow-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-campus-textDim block">
                  Overall
                </span>
                <span className="text-xl font-light tracking-tight text-campus-text">
                  {summary.overallPercentage}%
                </span>
              </div>
              <div className="text-[11px] text-campus-textMuted border-l border-black/5 pl-3">
                {summary.attendedClassesOverall} / {summary.totalClassesOverall} Attended
              </div>
            </div>
          ) : undefined
        }
      />

      {/* Notice Banner */}
      <Card tint="tint-1" className="p-3.5 flex items-center gap-2.5 text-xs text-campus-textMuted">
        <Info className="w-4 h-4 text-campus-jade-700 flex-shrink-0" />
        <span>Attendance is self-reported and for personal tracking.</span>
      </Card>

      {/* Date Switcher Chips (Past 7 Days allowed, future rejected) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-medium text-campus-textDim whitespace-nowrap pl-1 pr-1">Date:</span>
        {pastDays.map((d) => (
          <Chip
            key={d.formatted}
            label={d.display}
            active={selectedDate === d.formatted}
            onClick={() => setSelectedDate(d.formatted)}
          />
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          {/* Today's Classes Timetable Card */}
          <Card tint="default" className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-campus-jade-700" />
                <h2 className="text-sm font-medium text-campus-text">
                  Classes on {dayjs(selectedDate).format('dddd, D MMMM YYYY')}
                </h2>
              </div>
              <span className="text-[11px] text-campus-textDim">
                {classes.length} class{classes.length !== 1 ? 'es' : ''} scheduled
              </span>
            </div>

            {classes.length === 0 ? (
              <p className="text-xs text-campus-textMuted py-6 text-center">
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
                      className="p-4 bg-campus-surface rounded-[18px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge label={cls.code} variant="sage" />
                          <span className="text-xs font-medium text-campus-text">{cls.name}</span>
                        </div>
                        <div className="text-[11px] text-campus-textDim mt-1">
                          {cls.startTime} - {cls.endTime} • Room {cls.room} {cls.facultyName ? `• ${cls.facultyName}` : ''}
                        </div>
                      </div>

                      {/* Attended / Missed Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          disabled={markingId === cls.subjectId}
                          onClick={() => handleMarkAttendance(cls.subjectId, 'PRESENT')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs ${
                            isPresent
                              ? 'bg-campus-text text-white'
                              : 'bg-white text-campus-text hover:bg-campus-jade-50 hover:text-campus-jade-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isPresent ? 'Attended' : 'Mark Attended'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={markingId === cls.subjectId}
                          onClick={() => handleMarkAttendance(cls.subjectId, 'ABSENT')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs ${
                            isAbsent
                              ? 'bg-campus-alert-red text-white'
                              : 'bg-white text-campus-text hover:bg-campus-alert-redBg hover:text-campus-alert-red'
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
          </Card>

          {/* Per-Subject Status Cards */}
          <div>
            <h2 className="text-sm font-medium text-campus-text mb-3 px-1">Enrolled Course Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary?.subjects.map((sub, idx) => {
                const isSafe = sub.percentage >= 80;
                const isBorderline = sub.percentage >= 75 && sub.percentage < 80;

                const cardTint = isSafe ? 'tint-1' : isBorderline ? 'tint-3' : 'tint-4';
                const statusVariant: 'jade' | 'amber' | 'blush' = isSafe ? 'jade' : isBorderline ? 'amber' : 'blush';

                return (
                  <Card
                    key={sub.id}
                    tint={cardTint}
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge label={sub.code} variant="sage" />
                        <span className="text-base font-light tracking-tight text-campus-text">
                          {sub.percentage}%
                        </span>
                      </div>

                      <h3 className="text-xs font-medium text-campus-text mb-0.5">{sub.name}</h3>
                      <p className="text-[11px] text-campus-textDim mb-3">
                        {sub.attended} of {sub.total} classes attended {sub.facultyName ? `• ${sub.facultyName}` : ''}
                      </p>

                      {/* Progress Bar */}
                      <ProgressBar
                        percentage={sub.percentage}
                        variant={statusVariant}
                      />
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className={`text-[11px] font-medium ${isSafe ? 'text-campus-jade-700' : 'text-campus-alert-red'}`}>
                        {sub.statusText}
                      </span>
                      <span className="text-[10px] text-campus-textDim">Target: 80%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
