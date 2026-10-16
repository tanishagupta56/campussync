import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip, Modal, EmptyState, LoadingSkeleton } from '../../components/ui';
import { Users, Mail, Phone, ExternalLink, Search, Copy, Check } from 'lucide-react';

interface MentorItem {
  id: string;
  userId: string;
  fullName: string;
  program: string;
  branch: string;
  yearOfStudy: number;
  bio?: string;
  interests: string[];
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
  isSameBranch: boolean;
}

export const ConnectPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [interestSearch, setInterestSearch] = useState('');
  const [activeContactMentor, setActiveContactMentor] = useState<MentorItem | null>(null);
  const [copied, setCopied] = useState(false);

  const isEligibleYear = (user?.studentProfile?.yearOfStudy || 1) >= 2;
  const [isAvailable, setIsAvailable] = useState(user?.mentorProfile?.isAvailable || false);
  const [toggling, setToggling] = useState(false);

  async function loadMentors() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch !== 'ALL') params.append('branch', selectedBranch);
      if (interestSearch.trim()) params.append('interest', interestSearch.trim());

      const url = `/api/mentors?${params.toString()}`;
      const data = await apiRequest<MentorItem[]>(url);
      setMentors(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load mentors', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMentors();
  }, [selectedBranch, interestSearch]);

  async function toggleAvailability() {
    if (!isEligibleYear) {
      showToast('Only students in Year 2 or above can mentor', 'error');
      return;
    }
    setToggling(true);
    try {
      const nextState = !isAvailable;
      await apiRequest('/api/mentors/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: nextState }),
      });
      setIsAvailable(nextState);
      showToast(nextState ? 'You are now visible as a student mentor' : 'Mentor availability paused', 'success');
      loadMentors();
    } catch (err: any) {
      showToast(err.message || 'Failed to update availability', 'error');
    } finally {
      setToggling(false);
    }
  }

  function copyEmailToClipboard(emailStr: string) {
    navigator.clipboard.writeText(emailStr);
    setCopied(true);
    showToast('Mentor email copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  const branchOptions = [
    { label: 'All Departments', value: 'ALL' },
    { label: 'Computer Science', value: 'Computer Science & Engineering' },
    { label: 'Electronics', value: 'Electronics & Communication' },
    { label: 'Mechanical', value: 'Mechanical Engineering' },
    { label: 'Electrical', value: 'Electrical Engineering' },
  ];

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Senior Mentorship"
        subtitle="Connect with 2nd, 3rd, and 4th-year seniors for academic guidance, career prep, and lab support."
        actions={
          isEligibleYear ? (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="text-xs font-medium text-campus-text">Available as mentor:</span>
              <button
                type="button"
                onClick={toggleAvailability}
                disabled={toggling}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isAvailable ? 'bg-campus-jade-700' : 'bg-campus-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isAvailable ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-campus-textDim italic">Mentorship opt-in unlocks in Year 2</span>
          )
        }
      />

      {/* Search and Branch Filter Chips */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by topic or interest (e.g. Machine Learning, DevOps)..."
            value={interestSearch}
            onChange={(e) => setInterestSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {branchOptions.map((b) => (
            <Chip
              key={b.value}
              label={b.label}
              active={selectedBranch === b.value}
              onClick={() => setSelectedBranch(b.value)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : mentors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching mentors found"
          description="Try expanding your search or selecting all departments."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <Card
              key={mentor.id}
              tint={mentor.isSameBranch ? 'tint-1' : 'default'}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    label={`Year ${mentor.yearOfStudy} (${mentor.program})`}
                    variant="sage"
                  />
                  {mentor.isSameBranch && (
                    <Badge label="Your Dept" variant="jade" />
                  )}
                </div>

                <h3 className="text-sm font-medium text-campus-text mb-0.5">{mentor.fullName}</h3>
                <p className="text-[11px] text-campus-textDim mb-2.5">{mentor.branch}</p>

                {mentor.bio && (
                  <p className="text-xs text-campus-textMuted leading-relaxed mb-3 line-clamp-3">
                    {mentor.bio}
                  </p>
                )}

                {mentor.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mentor.interests.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-white/80 border border-black/5 px-2.5 py-0.5 rounded-full text-campus-textMuted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {mentor.phone && (
                    <a
                      href={`tel:${mentor.phone}`}
                      className="p-1.5 bg-white rounded-full text-campus-textMuted hover:text-campus-text shadow-xs"
                      title={`Call ${mentor.phone}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {mentor.linkedInUrl && (
                    <a
                      href={mentor.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-white rounded-full text-campus-textMuted hover:text-campus-jade-700 shadow-xs"
                      title="Open LinkedIn Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {mentor.email ? (
                  <button
                    type="button"
                    onClick={() => setActiveContactMentor(mentor)}
                    className="px-3.5 py-1.5 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Mentor</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-campus-textDim italic">Email hidden</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Mentor Modal */}
      <Modal
        isOpen={!!activeContactMentor}
        onClose={() => setActiveContactMentor(null)}
        title="Contact Mentor"
        maxWidth="max-w-md"
      >
        {activeContactMentor && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-campus-jade-50 text-campus-jade-700 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-campus-text">{activeContactMentor.fullName}</h2>
                <p className="text-[11px] text-campus-textDim">
                  Year {activeContactMentor.yearOfStudy} • {activeContactMentor.branch}
                </p>
              </div>
            </div>

            <div className="p-4 bg-campus-surface rounded-[18px] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-campus-textDim">College Email:</span>
                <span className="font-medium text-campus-text">{activeContactMentor.email}</span>
              </div>
              {activeContactMentor.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-campus-textDim">Phone:</span>
                  <a href={`tel:${activeContactMentor.phone}`} className="font-medium text-campus-jade-700 hover:underline">
                    {activeContactMentor.phone}
                  </a>
                </div>
              )}
              {activeContactMentor.linkedInUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-campus-textDim">LinkedIn:</span>
                  <a
                    href={activeContactMentor.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-campus-jade-700 hover:underline flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {activeContactMentor.email && (
                <>
                  <button
                    type="button"
                    onClick={() => copyEmailToClipboard(activeContactMentor.email!)}
                    className="w-full py-2.5 bg-white border border-campus-border rounded-full text-xs font-medium text-campus-text hover:bg-campus-surface flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-campus-jade-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Email Copied!' : 'Copy Email'}</span>
                  </button>

                  <a
                    href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(activeContactMentor.email)}&su=${encodeURIComponent('CampusSync Mentorship Inquiry')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Gmail</span>
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => setActiveContactMentor(null)}
                className="w-full py-2 text-campus-textMuted hover:text-campus-text text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
