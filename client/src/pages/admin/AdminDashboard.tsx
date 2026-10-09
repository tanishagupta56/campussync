import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Book,
  Bell,
  RefreshCw,
  LogOut,
  Minus,
} from 'lucide-react';
import dayjs from 'dayjs';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [library, setLibrary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-campus-bg text-campus-text">
      {/* Admin Nav */}
      <nav className="bg-campus-card border-b border-campus-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <div>
            <h1 className="text-sm font-bold text-campus-text">CampusSync Administrator</h1>
            <span className="text-[11px] text-campus-jade-700 font-semibold">Central Admin Console</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-campus-text">{user?.fullName}</div>
            <div className="text-[11px] text-campus-textMuted">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-campus-border hover:bg-campus-surface text-xs font-medium text-campus-textMuted hover:text-campus-text transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Library Gate Controls */}
        <div className="p-6 bg-campus-card border border-campus-border rounded-xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Book className="w-5 h-5 text-campus-jade-700" />
              <h2 className="text-sm font-bold text-campus-text">Library Gate Operator Controls</h2>
            </div>
            {library && (
              <span className="text-xs text-campus-jade-700 font-semibold bg-campus-jade-50 px-2.5 py-1 rounded-full border border-campus-jade-200">
                {library.occupied} / {library.capacity} Occupied ({library.available} free)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateLibrary(-1)}
              className="px-4 py-2 border border-campus-border rounded-lg text-xs font-semibold bg-white hover:bg-campus-surface flex items-center space-x-1.5"
            >
              <Minus className="w-4 h-4" />
              <span>Gate Exit (-1)</span>
            </button>
            <button
              onClick={() => updateLibrary(1)}
              className="px-4 py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Gate Entry (+1)</span>
            </button>
          </div>
        </div>

        {/* 3 Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Announcement */}
          <div className="p-5 bg-campus-card border border-campus-border rounded-xl shadow-card">
            <div className="flex items-center space-x-2 mb-3 text-xs font-bold text-campus-jade-700 uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Publish Notice</span>
            </div>
            <form onSubmit={createAnnouncement} className="space-y-3">
              <input
                type="text"
                placeholder="Notice Title"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <textarea
                placeholder="Notice description & details"
                required
                rows={3}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
              </select>
              <button
                type="submit"
                className="w-full py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800"
              >
                Post (Verified by Admin)
              </button>
            </form>
          </div>

          {/* Create Event */}
          <div className="p-5 bg-campus-card border border-campus-border rounded-xl shadow-card">
            <div className="flex items-center space-x-2 mb-3 text-xs font-bold text-campus-jade-700 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Create Event</span>
            </div>
            <form onSubmit={createEvent} className="space-y-3">
              <input
                type="text"
                placeholder="Event Title"
                required
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Location (e.g. Auditorium)"
                value={evLocation}
                onChange={(e) => setEvLocation(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <select
                value={evCategory}
                onChange={(e) => setEvCategory(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
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
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800"
              >
                Add to Calendar
              </button>
            </form>
          </div>

          {/* Create Deadline */}
          <div className="p-5 bg-campus-card border border-campus-border rounded-xl shadow-card">
            <div className="flex items-center space-x-2 mb-3 text-xs font-bold text-campus-jade-700 uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Post Deadline</span>
            </div>
            <form onSubmit={createDeadline} className="space-y-3">
              <input
                type="text"
                placeholder="Deadline Title"
                required
                value={dlTitle}
                onChange={(e) => setDlTitle(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <select
                value={dlCategory}
                onChange={(e) => setDlCategory(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
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
                className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800"
              >
                Set Deadline
              </button>
            </form>
          </div>
        </div>

        {/* Existing Announcements Management Table */}
        <div className="p-6 bg-campus-card border border-campus-border rounded-xl shadow-card">
          <h2 className="text-sm font-bold text-campus-text mb-4">Manage Live Campus Announcements</h2>
          <div className="space-y-2.5">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-campus-surface rounded-lg border border-campus-borderSubtle flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900 uppercase">
                      {item.sourceCategory}
                    </span>
                    {item.isVerifiedByAdmin && (
                      <span className="text-[10px] text-campus-jade-700 font-semibold bg-campus-jade-50 px-2 py-0.5 rounded-full">
                        Verified by Admin
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-campus-text truncate">{item.title}</h3>
                  <p className="text-[11px] text-campus-textMuted line-clamp-1">{item.content}</p>
                </div>

                <button
                  onClick={() => deleteAnnouncement(item.id)}
                  className="p-2 text-campus-textDim hover:text-campus-alert-red hover:bg-campus-alert-redBg rounded-lg transition-colors flex-shrink-0"
                  title="Remove announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
