import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import { PageHeader, Card, Badge, EmptyState } from '../../components/ui';
import { AdminOverviewPanel } from './AdminOverviewPanel';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Book,
  Bell,
  LogOut,
  Minus,
} from 'lucide-react';
import dayjs from 'dayjs';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [library, setLibrary] = useState<any>(null);

  // Forms
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('NORMAL');

  const [evTitle, setEvTitle] = useState('');
  const [evCategory, setEvCategory] = useState('CAMPUS');
  const [evLocation, setEvLocation] = useState('');
  const [evDate, setEvDate] = useState(dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'));

  const [dlTitle, setDlTitle] = useState('');
  const [dlCategory, setDlCategory] = useState('ACADEMIC');
  const [dlDate, setDlDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DDTHH:mm'));

  async function loadData() {
    try {
      const [annRes, libRes] = await Promise.all([
        apiRequest<any[]>('/api/announcements'),
        apiRequest<any>('/api/library'),
      ]);
      setAnnouncements(annRes);
      setLibrary(libRes);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: annTitle, content: annContent, priority: annPriority }),
      });
      setAnnTitle('');
      setAnnContent('');
      showToast('Announcement published with verified badge', 'success');
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function deleteAnnouncement(id: string) {
    try {
      await apiRequest(`/api/announcements/${id}`, { method: 'DELETE' });
      showToast('Announcement removed', 'info');
      loadData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!evTitle.trim()) return;
    try {
      await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: evTitle,
          category: evCategory,
          location: evLocation || 'Main Campus',
          startTime: new Date(evDate).toISOString(),
        }),
      });
      setEvTitle('');
      setEvLocation('');
      showToast('Calendar event created', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function createDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!dlTitle.trim()) return;
    try {
      await apiRequest('/api/deadlines', {
        method: 'POST',
        body: JSON.stringify({
          title: dlTitle,
          category: dlCategory,
          dueDate: new Date(dlDate).toISOString(),
          source: 'Central Administration',
        }),
      });
      setDlTitle('');
      showToast('Deadline published', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  async function updateLibrary(delta: number) {
    try {
      const updated = await apiRequest('/api/library', {
        method: 'PATCH',
        body: JSON.stringify({ delta }),
      });
      setLibrary(updated);
      showToast(delta > 0 ? '+1 Library entry recorded' : '-1 Library exit recorded', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-campus-bg)] text-campus-text p-3 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-campus-surface rounded-[28px] p-6 sm:p-8 shadow-card flex flex-col gap-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-campus-text flex items-center justify-center text-white font-medium text-sm">
              CS
            </div>
            <div>
              <h1 className="text-sm font-medium text-campus-text">CampusSync Administrator</h1>
              <span className="text-[11px] text-campus-jade-700 font-medium">Central Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-campus-text">{user?.fullName}</div>
              <div className="text-[11px] text-campus-textDim">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-xs font-medium text-campus-textMuted hover:text-campus-text shadow-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <PageHeader
          title="Administrative Controls"
          subtitle="Publish verified notices, schedule campus calendar events, set deadlines, and operate gate turnstiles."
        />

        {/* Two-column layout: main controls left, overview panel right */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Controls Column */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">


        {/* Library Gate Controls */}
        <Card tint="tint-1" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-white/80 rounded-2xl text-campus-jade-700 shadow-xs">
                <Book className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-campus-text">Library Gate Operator Controls</h2>
                <p className="text-xs text-campus-textMuted">Adjust desk occupancy counters in real-time</p>
              </div>
            </div>
            {library && (
              <Badge
                label={`${library.occupied} / ${library.capacity} Occupied (${library.available} free)`}
                variant="jade"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateLibrary(-1)}
              className="px-4 py-2 bg-white rounded-full text-xs font-medium text-campus-text hover:bg-campus-surface shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Minus className="w-4 h-4" />
              <span>Gate Exit (-1)</span>
            </button>
            <button
              type="button"
              onClick={() => updateLibrary(1)}
              className="px-4 py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Gate Entry (+1)</span>
            </button>
          </div>
        </Card>

        {/* 3 Action Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Announcement */}
          <Card tint="tint-2" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label="Publish Notice" variant="jade" icon={Bell} />
              </div>
              <form onSubmit={createAnnouncement} className="space-y-3">
                <input
                  type="text"
                  placeholder="Notice Title"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <textarea
                  placeholder="Notice description & details"
                  required
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors shadow-xs"
                >
                  Post (Verified by Admin)
                </button>
              </form>
            </div>
          </Card>

          {/* Create Event */}
          <Card tint="tint-3" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label="Create Event" variant="sage" icon={Calendar} />
              </div>
              <form onSubmit={createEvent} className="space-y-3">
                <input
                  type="text"
                  placeholder="Event Title"
                  required
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Auditorium)"
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <select
                  value={evCategory}
                  onChange={(e) => setEvCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                >
                  <option value="CAMPUS">Campus Event</option>
                  <option value="ACADEMIC">Academic Session</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="COMPETITION">Competition</option>
                </select>
                <input
                  type="datetime-local"
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors shadow-xs"
                >
                  Add to Calendar
                </button>
              </form>
            </div>
          </Card>

          {/* Create Deadline */}
          <Card tint="tint-4" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label="Post Deadline" variant="blush" icon={Clock} />
              </div>
              <form onSubmit={createDeadline} className="space-y-3">
                <input
                  type="text"
                  placeholder="Deadline Title"
                  required
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <select
                  value={dlCategory}
                  onChange={(e) => setDlCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                >
                  <option value="ACADEMIC">Academic Submission</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="REGISTRATION">Registration</option>
                  <option value="SCHOLARSHIP">Scholarship Portal</option>
                </select>
                <input
                  type="datetime-local"
                  value={dlDate}
                  onChange={(e) => setDlDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors shadow-xs"
                >
                  Set Deadline
                </button>
              </form>
            </div>
          </Card>
        </div>

        {/* Existing Announcements Management Table */}
        <Card tint="default" className="p-6">
          <h2 className="text-sm font-medium text-campus-text mb-4">Manage Live Campus Announcements</h2>
          {announcements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No live notices"
              description="Notices posted above will appear here for management."
            />
          ) : (
            <div className="space-y-2.5">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-campus-surface rounded-[18px] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge label={item.sourceCategory} variant="sage" />
                      {item.isVerifiedByAdmin && (
                        <Badge label="Verified by Admin" variant="jade" icon={ShieldCheck} />
                      )}
                    </div>
                    <h3 className="text-xs font-medium text-campus-text truncate">{item.title}</h3>
                    <p className="text-[11px] text-campus-textMuted line-clamp-1">{item.content}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(item.id)}
                    className="p-2 text-campus-textDim hover:text-campus-alert-red hover:bg-campus-alert-redBg rounded-full transition-colors flex-shrink-0"
                    title="Remove announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

          </div>{/* end main controls column */}

          {/* Right Overview Panel (320px, sticky) */}
          <aside className="xl:w-[320px] flex-shrink-0">
            <div className="sticky top-6 rounded-[22px] bg-white p-5 shadow-card">
              <AdminOverviewPanel />
            </div>
          </aside>

        </div>{/* end two-column flex */}

      </div>
    </div>
  );
};
