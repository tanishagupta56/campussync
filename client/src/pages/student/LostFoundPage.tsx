import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Modal, EmptyState, LoadingSkeleton } from '../../components/ui';
import { Search, Plus, MapPin, Calendar, CheckCircle2, Mail, Phone } from 'lucide-react';
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
    <div className="py-2 space-y-6">
      <PageHeader
        title="Lost & Found"
        subtitle="Active campus loss reports. Listings automatically expire after 30 days."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-campus-text text-white hover:bg-black shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Lost Item</span>
          </button>
        }
      />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No active lost items"
          description="All reported items have been recovered or expired."
          action={
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-3 px-4 py-1.5 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black transition-colors"
            >
              Post a Lost Item
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const isOwner = item.userId === user?.id || user?.role === 'ADMINISTRATOR';
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = tints[idx % tints.length];

            return (
              <Card
                key={item.id}
                tint={tint}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge label="Active Notice" variant="amber" />
                    <span className="text-[10px] text-campus-textDim">
                      Posted {dayjs(item.createdAt).format('D MMM')}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-1">{item.title}</h3>
                  <p className="text-xs text-campus-textMuted leading-relaxed mb-3 line-clamp-3">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-campus-textDim bg-white/70 p-3 rounded-[16px] mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span className="truncate">{item.locationLost}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span>
                        {dayjs(item.dateLost).format('D MMM YYYY')} {item.timeLost ? `(${item.timeLost})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                      <span className="truncate">{item.contactEmail}</span>
                    </div>
                    {item.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-campus-jade-700 flex-shrink-0" />
                        <span>{item.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => markFound(item.id)}
                    className="w-full py-2 bg-white text-campus-jade-700 border border-campus-jade-200 rounded-full text-xs font-medium hover:bg-campus-jade-50 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as FOUND</span>
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Lost Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post a Lost Item"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-campus-textMuted mb-2">
            Details will appear across student feeds. Listings automatically expire after 30 days.
          </p>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Blue Titan Water Bottle, Casio fx-991CW Calculator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              Description & Distinct Marks *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Color, brand, keychains, stickers, or where inside the room it might have been left..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
                Location Lost *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Library Floor 2, Mech Lab"
                value={locationLost}
                onChange={(e) => setLocationLost(e.target.value)}
                className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
                Date Lost *
              </label>
              <input
                type="date"
                required
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
                Approximate Time
              </label>
              <input
                type="text"
                placeholder="e.g. ~2:30 PM after lunch"
                value={timeLost}
                onChange={(e) => setTimeLost(e.target.value)}
                className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
                Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-campus-textDim mb-1 uppercase tracking-wider">
              College Email / ID *
            </label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-campus-surface rounded-xl text-xs text-campus-text outline-hidden focus:ring-2 focus:ring-campus-jade-700"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-medium text-campus-textMuted hover:text-campus-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
