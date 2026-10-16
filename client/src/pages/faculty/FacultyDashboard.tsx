import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import { PageHeader, Card, Badge } from '../../components/ui';
import {
  GraduationCap,
  Bell,
  Calendar,
  Clock,
  LogOut,
  Users,
  CheckCircle2,
} from 'lucide-react';
import dayjs from 'dayjs';

interface SubjectOverview {
  id: string;
  code: string;
  name: string;
  branch: string;
  semester: number;
  totalMarks: number;
  averageAttendance: number;
}

export const FacultyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState<SubjectOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('NORMAL');
  const [annSubmitting, setAnnSubmitting] = useState(false);

  const [evTitle, setEvTitle] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [evDate, setEvDate] = useState(dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'));
  const [evSubmitting, setEvSubmitting] = useState(false);

  const [dlTitle, setDlTitle] = useState('');
  const [dlDate, setDlDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DDTHH:mm'));
  const [dlSubmitting, setDlSubmitting] = useState(false);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await apiRequest<{ subjects: SubjectOverview[] }>('/api/faculty/overview');
      setSubjects(res.subjects);
    } catch (err: any) {
      showToast(err.message || 'Failed to load faculty overview', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnSubmitting(true);
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
          targetDepartment: 'Computer Science & Engineering',
        }),
      });
      showToast('Academic announcement published', 'success');
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish notice', 'error');
    } finally {
      setAnnSubmitting(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!evTitle.trim()) return;
    setEvSubmitting(true);
    try {
      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: evTitle,
          category: 'ACADEMIC',
          location: evLocation || 'Lecture Hall',
          startTime: new Date(evDate).toISOString(),
        }),
      });
      showToast('Academic event scheduled on campus calendar', 'success');
      setEvTitle('');
      setEvLocation('');
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule event', 'error');
    } finally {
      setEvSubmitting(false);
    }
  }

  async function handleCreateDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!dlTitle.trim()) return;
    setDlSubmitting(true);
    try {
      await apiRequest('/api/deadlines', {
        method: 'POST',
        body: JSON.stringify({
          title: dlTitle,
          category: 'ASSIGNMENT',
          dueDate: new Date(dlDate).toISOString(),
          source: user?.fullName || 'Faculty Instructor',
        }),
      });
      showToast('Academic deadline posted to students', 'success');
      setDlTitle('');
    } catch (err: any) {
      showToast(err.message || 'Failed to post deadline', 'error');
    } finally {
      setDlSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-campus-bg)] p-4 md:p-8 text-campus-text">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-campus-jade-700 text-white flex items-center justify-center font-bold">
              FA
            </div>
            <div>
              <h1 className="text-xl font-light text-campus-text">Faculty Portal</h1>
              <p className="text-xs text-campus-textDim">{user?.fullName} &bull; Academic Instructor</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-xs font-semibold text-campus-textMuted hover:text-campus-alert-red shadow-subtle"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Aggregate Attendance for Own Subjects ONLY */}
        <div>
          <div className="text-xs uppercase font-semibold text-campus-textDim mb-3">
            Assigned Subjects & Attendance Aggregates
          </div>
          {subjects.length === 0 ? (
            <Card tint="default">
              <p className="text-xs text-campus-textMuted">No courses assigned to your faculty profile.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <Card key={sub.id} tint="tint-1">
                  <div className="flex items-center justify-between mb-2">
                    <Badge label={sub.code} variant="jade" />
                    <span className="text-base font-bold text-campus-jade-700">
                      {sub.averageAttendance}% Avg Attendance
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-campus-text">{sub.name}</h3>
                  <div className="text-[11px] text-campus-textDim mt-2 flex justify-between border-t border-black/5 pt-2">
                    <span>{sub.branch} (Sem {sub.semester})</span>
                    <span>{sub.totalMarks} student attendance logs</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 3 Forms Grid: Announcement, Event, Deadline */}
        <div>
          <div className="text-xs uppercase font-semibold text-campus-textDim mb-3">
            Academic Operations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Academic Notice */}
            <Card tint="tint-2">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-campus-jade-700">
                <Bell className="w-4 h-4" />
                <span>Publish Academic Notice</span>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Notice Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Notice description..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <button
                  type="submit"
                  disabled={annSubmitting}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800"
                >
                  {annSubmitting ? 'Posting...' : 'Post Notice'}
                </button>
              </form>
            </Card>

            {/* Academic Event */}
            <Card tint="tint-3">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-campus-jade-700">
                <Calendar className="w-4 h-4" />
                <span>Schedule Academic Session</span>
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Session / Lab Title"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. LH-101)"
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <input
                  type="datetime-local"
                  required
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <button
                  type="submit"
                  disabled={evSubmitting}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800"
                >
                  {evSubmitting ? 'Scheduling...' : 'Add to Calendar'}
                </button>
              </form>
            </Card>

            {/* Assignment Deadline */}
            <Card tint="tint-1">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-campus-jade-700">
                <Clock className="w-4 h-4" />
                <span>Post Submission Deadline</span>
              </div>
              <form onSubmit={handleCreateDeadline} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Assignment / Lab Submission Title"
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <input
                  type="datetime-local"
                  required
                  value={dlDate}
                  onChange={(e) => setDlDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <button
                  type="submit"
                  disabled={dlSubmitting}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800"
                >
                  {dlSubmitting ? 'Posting...' : 'Set Deadline'}
                </button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
