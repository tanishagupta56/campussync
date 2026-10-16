import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState } from '../../components/ui';
import {
  Award,
  Search,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Users,
  Calendar,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import dayjs from 'dayjs';

interface ScholarshipItem {
  id: string;
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string;
  branch: string | null;
  applicationLink: string;
  isVerifiedByAdmin: boolean;
  recipientCount: number;
  mentorsAvailableCount: number;
  isSaved: boolean;
  applicationStatus: string | null;
}

export const ScholarshipsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMINISTRATOR';

  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeModalItem, setActiveModalItem] = useState<ScholarshipItem | null>(null);

  // Admin add scholarship modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDeadline, setFormDeadline] = useState(dayjs().add(30, 'day').format('YYYY-MM-DD'));
  const [formDesc, setFormDesc] = useState('');
  const [formElig, setFormElig] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formLink, setFormLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadScholarships() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedBranch !== 'ALL') params.append('branch', selectedBranch);
      const res = await apiRequest<ScholarshipItem[]>(`/api/scholarships?${params.toString()}`);
      setScholarships(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load scholarships', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScholarships();
  }, [selectedBranch, searchTerm]);

  async function handleToggleSave(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await apiRequest<{ success: boolean; isSaved: boolean }>(`/api/scholarships/${id}/save`, {
        method: 'POST',
      });
      setScholarships((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isSaved: res.isSaved } : s))
      );
      showToast(res.isSaved ? 'Scholarship saved to your bookmarks' : 'Removed from saved scholarships', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not update save status', 'error');
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      await apiRequest(`/api/scholarships/${id}`, { method: 'DELETE' });
      showToast('Scholarship removed (soft-deleted from listings)', 'info');
      loadScholarships();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete scholarship', 'error');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !formName.trim() || !formProvider.trim() || !formLink.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest('/api/scholarships', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          provider: formProvider,
          amount: formAmount,
          deadline: formDeadline,
          description: formDesc,
          eligibility: formElig,
          branch: formBranch || null,
          applicationLink: formLink,
          isVerifiedByAdmin: true,
        }),
      });
      showToast('Scholarship posted with Verified badge', 'success');
      setAddModalOpen(false);
      setFormName('');
      setFormProvider('');
      setFormAmount('');
      setFormDesc('');
      setFormElig('');
      setFormLink('');
      loadScholarships();
    } catch (err: any) {
      showToast(err.message || 'Failed to create scholarship', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const branches = [
    'ALL',
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Electrical Engineering',
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Scholarships & Grants"
        subtitle="Explore institutional, government, and corporate scholarships. Verified grant awards with mentor connections."
        actions={
          isAdmin ? (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-semibold hover:bg-campus-jade-800 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Scholarship</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by scholarship title, provider, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700"
          />
        </div>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full md:w-auto px-4 py-2 bg-white rounded-full text-xs font-medium text-campus-text shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700"
        >
          {branches.map((b) => (
            <option key={b} value={b}>
              {b === 'ALL' ? 'All Engineering Branches' : b}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted font-medium">Loading scholarships...</span>
        </div>
      ) : scholarships.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No scholarships found"
          description="Try clearing your search query or department filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scholarships.map((s, idx) => {
            const tints: ('tint-1' | 'tint-2' | 'tint-3')[] = ['tint-1', 'tint-2', 'tint-3'];
            const tint = tints[idx % tints.length];
            const daysLeft = dayjs(s.deadline).diff(dayjs(), 'day');

            return (
              <Card
                key={s.id}
                tint={tint}
                onClick={() => setActiveModalItem(s)}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-campus-jade-700">{s.amount}</span>
                      {s.isVerifiedByAdmin && (
                        <Badge label="Verified by Administration" variant="jade" icon={ShieldCheck} />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleSave(s.id, e)}
                        className={`p-1.5 rounded-full transition-colors ${
                          s.isSaved ? 'text-campus-jade-700 bg-white' : 'text-campus-textDim hover:text-campus-text'
                        }`}
                        title={s.isSaved ? 'Saved' : 'Save scholarship'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${s.isSaved ? 'fill-current' : ''}`} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={(e) => handleDelete(s.id, e)}
                          className="p-1.5 rounded-full text-campus-textDim hover:text-campus-alert-red hover:bg-white"
                          title="Soft delete scholarship"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-campus-text mb-1 leading-snug">{s.name}</h3>
                  <p className="text-[11px] font-medium text-campus-textDim mb-2">{s.provider}</p>
                  <p className="text-xs text-campus-textMuted line-clamp-2 leading-relaxed mb-3">
                    {s.description}
                  </p>

                  {/* CampusSync recipient metrics */}
                  <div className="p-2.5 bg-white/70 rounded-xl space-y-1 mb-3 text-[11px] text-campus-textMuted">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-campus-jade-700" />
                      <span>
                        <strong>{s.recipientCount}</strong> previous CampusSync student{s.recipientCount === 1 ? '' : 's'} received this
                      </span>
                    </div>
                    {s.mentorsAvailableCount > 0 && (
                      <div className="text-[10px] text-campus-jade-700 font-semibold pl-5">
                        &bull; {s.mentorsAvailableCount} available as mentors in Connect
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-campus-textDim">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-campus-jade-700" />
                    <span>Deadline: {dayjs(s.deadline).format('D MMM YYYY')} ({daysLeft}d left)</span>
                  </div>

                  <a
                    href={s.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 font-semibold text-campus-jade-700 hover:underline"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          title={activeModalItem.name}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-campus-textDim">Provider:</span>
                <p className="text-sm font-semibold text-campus-text">{activeModalItem.provider}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-campus-textDim">Grant Value:</span>
                <p className="text-base font-bold text-campus-jade-700">{activeModalItem.amount}</p>
              </div>
            </div>

            <div className="p-3 bg-campus-surface rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-semibold text-campus-text">Eligibility Criteria:</span>
                <p className="text-campus-textMuted mt-0.5">{activeModalItem.eligibility}</p>
              </div>
              <div className="pt-2 border-t border-black/5">
                <span className="font-semibold text-campus-text">Deadline:</span>
                <p className="text-campus-textMuted mt-0.5">
                  {dayjs(activeModalItem.deadline).format('dddd, D MMMM YYYY')}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-campus-text">Description:</span>
              <p className="text-xs text-campus-textMuted leading-relaxed mt-1">
                {activeModalItem.description}
              </p>
            </div>

            <div className="p-3 bg-[var(--card-tint-2)] rounded-xl text-xs text-campus-jade-900 flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {activeModalItem.recipientCount} CampusSync students awarded
                </p>
                <span className="text-[11px] text-campus-jade-700">
                  {activeModalItem.mentorsAvailableCount} available for peer mentorship
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-campus-textMuted hover:bg-campus-surface"
              >
                Close
              </button>
              <a
                href={activeModalItem.applicationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-semibold hover:bg-campus-jade-800"
              >
                <span>Proceed to Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Add Modal */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Add New Scholarship (Admin)"
        >
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Scholarship Name *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
            />
            <input
              type="text"
              required
              placeholder="Provider / Ministry / Foundation *"
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value)}
              className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Grant Value (e.g. ₹50,000 / year)"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
              />
              <input
                type="date"
                required
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
              />
            </div>
            <textarea
              required
              rows={3}
              placeholder="Description & Benefits *"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
            />
            <textarea
              required
              rows={2}
              placeholder="Eligibility Criteria *"
              value={formElig}
              onChange={(e) => setFormElig(e.target.value)}
              className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
            />
            <input
              type="url"
              required
              placeholder="Official Application URL *"
              value={formLink}
              onChange={(e) => setFormLink(e.target.value)}
              className="w-full px-3 py-2 bg-campus-surface rounded-xl text-xs outline-hidden"
            />
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-campus-textMuted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-full bg-campus-jade-700 text-white text-xs font-semibold hover:bg-campus-jade-800 disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Scholarship'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
