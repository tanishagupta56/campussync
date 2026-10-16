import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/apiClient';
import { PageHeader, Card, Badge } from '../../components/ui';
import {
  Users,
  Bell,
  Calendar,
  LogOut,
  ExternalLink,
  Mail,
  Edit3,
} from 'lucide-react';
import dayjs from 'dayjs';

interface ClubDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  contactEmail: string;
  websiteUrl?: string;
  events: { id: string; title: string; startTime: string; location: string }[];
}

export const ClubDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit club info
  const [desc, setDesc] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Create event for club
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [evDate, setEvDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DDTHH:mm'));
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Publish club announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  async function loadMyClub() {
    setLoading(true);
    try {
      const res = await apiRequest<ClubDetail>('/api/club/my-club');
      setClub(res);
      setDesc(res.description || '');
      setEmail(res.contactEmail || '');
      setWebsite(res.websiteUrl || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to load managed club', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyClub();
  }, []);

  async function handleUpdateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!club) return;
    setSavingInfo(true);
    try {
      const updated = await apiRequest<ClubDetail>(`/api/clubs/${club.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: desc,
          contactEmail: email,
          websiteUrl: website,
        }),
      });
      setClub((prev) => (prev ? { ...prev, ...updated } : null));
      showToast('Club details updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update club', 'error');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleCreateClubEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!club || !evTitle.trim()) return;
    setCreatingEvent(true);
    try {
      await apiRequest(`/api/clubs/${club.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          title: evTitle,
          description: evDesc,
          location: evLocation || 'Campus',
          startTime: new Date(evDate).toISOString(),
        }),
      });
      showToast('Event published to calendar under your society', 'success');
      setEvTitle('');
      setEvDesc('');
      setEvLocation('');
      loadMyClub();
    } catch (err: any) {
      showToast(err.message || 'Failed to create event', 'error');
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setPostingAnn(true);
    try {
      await apiRequest('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: 'NORMAL',
        }),
      });
      showToast('Society announcement published', 'success');
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      showToast(err.message || 'Failed to post announcement', 'error');
    } finally {
      setPostingAnn(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-campus-bg)] p-4 md:p-8 text-campus-text">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-campus-jade-700 text-white flex items-center justify-center font-bold">
              CC
            </div>
            <div>
              <h1 className="text-xl font-light text-campus-text">Club Core Lead Portal</h1>
              <p className="text-xs text-campus-textDim">
                {user?.fullName} &bull; Managing {club?.name || 'Assigned Society'}
              </p>
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

        {club ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Edit Club Info */}
            <Card tint="tint-1" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-campus-jade-700">Society Settings</span>
                <Badge label={club.category} variant="jade" />
              </div>

              <h2 className="text-base font-semibold text-campus-text">{club.name}</h2>

              <form onSubmit={handleUpdateClub} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-campus-textDim block mb-1">
                    Public Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-campus-textDim block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-campus-textDim block mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingInfo}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800 disabled:opacity-50"
                >
                  {savingInfo ? 'Saving...' : 'Update Society Info'}
                </button>
              </form>
            </Card>

            {/* Create Event for Society */}
            <Card tint="tint-2" className="space-y-4">
              <span className="text-xs uppercase font-bold text-campus-jade-700 block">
                Host Workshop / Meet
              </span>

              <form onSubmit={handleCreateClubEvent} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Event / Workshop Title"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Event details & recruitment info..."
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <input
                  type="text"
                  placeholder="Venue (e.g. Robotics Lab B-201)"
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
                  disabled={creatingEvent}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800 disabled:opacity-50"
                >
                  {creatingEvent ? 'Publishing...' : 'Add to Campus Calendar'}
                </button>
              </form>
            </Card>

            {/* Broadcast Notice */}
            <Card tint="tint-3" className="space-y-4">
              <span className="text-xs uppercase font-bold text-campus-jade-700 block">
                Broadcast Society Notice
              </span>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Notice Title (e.g. Rover Team Recruitment)"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="Recruitment criteria, interview dates, submission links..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs outline-hidden shadow-xs"
                />
                <button
                  type="submit"
                  disabled={postingAnn}
                  className="w-full py-2 bg-campus-jade-700 text-white rounded-full text-xs font-semibold hover:bg-campus-jade-800 disabled:opacity-50"
                >
                  {postingAnn ? 'Posting...' : 'Post Notice'}
                </button>
              </form>
            </Card>
          </div>
        ) : (
          <Card tint="default">
            <p className="text-xs text-campus-textMuted">No club assigned to this core lead profile.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
