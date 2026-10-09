import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, MapPin, Calendar, Clock, CheckCircle2, RefreshCw, X, Mail, Phone } from 'lucide-react';
import dayjs from 'dayjs';

interface LostItem {
  id: string;
  title: string;
  description: string;
  locationLost: string;
  dateLost: string;
  timeLost?: string;
  contactEmail: string;
  contactPhone?: string;
  imageUrl?: string;
  userId?: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}

export const LostFoundPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [dateLost, setDateLost] = useState(dayjs().format('YYYY-MM-DD'));
  const [timeLost, setTimeLost] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const data = await apiRequest<LostItem[]>('/api/lost-found');
      setItems(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load lost items', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !locationLost || !dateLost) return;
    setSubmitting(true);
    try {
      await apiRequest('/api/lost-found', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          locationLost,
          dateLost,
          timeLost: timeLost || null,
          contactEmail: contactEmail || user?.email,
          contactPhone: contactPhone || null,
          imageUrl: imageUrl || null,
        }),
      });
      showToast('Lost item posted to campus noticeboard', 'success');
      setModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setLocationLost('');
      setTimeLost('');
      setContactPhone('');
      setImageUrl('');
      loadItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to post item', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function markFound(id: string) {
    try {
      await apiRequest(`/api/lost-found/${id}/found`, { method: 'PATCH' });
      showToast('Item marked as FOUND and removed from active notices', 'success');
      loadItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to update item', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Lost & Found Noticeboard</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">Active campus loss reports. Listings automatically expire after 30 days.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="self-start md:self-auto px-4 py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Lost Item</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Loading active notices...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-campus-card border border-campus-border rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-campus-jade-700 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-semibold text-campus-text">No active lost items</p>
          <span className="text-[11px] text-campus-textMuted">All reported items have been recovered or expired.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isOwner = item.userId === user?.id || user?.role === 'ADMINISTRATOR';

            return (
              <div
                key={item.id}
                className="p-5 bg-campus-card border border-campus-border rounded-xl shadow-card flex flex-col justify-between hover:border-campus-sage-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-alert-amberBg text-campus-alert-amber border border-campus-alert-amberBorder uppercase">
                      Active Notice
                    </span>
                    <span className="text-[10px] text-campus-textDim">
                      Posted {dayjs(item.createdAt).format('D MMM')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-campus-text mb-1.5">{item.title}</h3>
                  <p className="text-xs text-campus-textMuted leading-relaxed mb-3">{item.description}</p>

                  <div className="space-y-1.5 text-xs text-campus-textDim bg-campus-surface p-3 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span className="truncate">{item.locationLost}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span>{dayjs(item.dateLost).format('D MMM YYYY')} {item.timeLost ? `(${item.timeLost})` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span className="truncate">{item.contactEmail}</span>
                    </div>
                    {item.contactPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                        <span>{item.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => markFound(item.id)}
                    className="w-full py-2 bg-campus-jade-50 text-campus-jade-700 border border-campus-jade-200 rounded-lg text-xs font-semibold hover:bg-campus-jade-100 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as FOUND</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lost Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-campus-card border border-campus-border rounded-xl max-w-lg w-full p-6 shadow-elevated relative animate-in fade-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-campus-textDim hover:text-campus-text hover:bg-campus-surface"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-campus-text mb-1">Post a Lost Item</h2>
            <p className="text-xs text-campus-textMuted mb-4">Provide accurate details to assist campus security and fellow students.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-campus-text mb-1">What was lost? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Casio Scientific Calculator, Blue Water Bottle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-campus-text mb-1">Where was it lost? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture Hall 101, Badminton Court, Food Court"
                  value={locationLost}
                  onChange={(e) => setLocationLost(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-campus-text mb-1">Date lost *</label>
                  <input
                    type="date"
                    required
                    value={dateLost}
                    onChange={(e) => setDateLost(e.target.value)}
                    className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-campus-text mb-1">Approximate time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={timeLost}
                    onChange={(e) => setTimeLost(e.target.value)}
                    className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-campus-text mb-1">Additional description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Color, brand, distinguishing marks or contents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-campus-text mb-1">College email / ID</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-campus-text mb-1">Phone number (optional)</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 border border-campus-border rounded-lg text-xs font-semibold text-campus-textMuted hover:bg-campus-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
