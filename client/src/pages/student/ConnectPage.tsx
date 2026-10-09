import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Users, Mail, Phone, ExternalLink, Search, RefreshCw, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

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

  // Year 2+ Availability Toggle State
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

  const branches = [
    'ALL',
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Electrical Engineering',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Connect: Senior Mentorship</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">
            Connect with 2nd, 3rd, and 4th-year seniors for academic guidance, career prep, and lab support.
          </p>
        </div>

        {/* Year 2+ Toggle Pill */}
        {isEligibleYear ? (
          <div className="flex items-center space-x-3 bg-campus-card border border-campus-border px-3.5 py-2 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-campus-text">Available as a mentor:</span>
            <button
              onClick={toggleAvailability}
              disabled={toggling}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isAvailable ? 'bg-campus-jade-700' : 'bg-campus-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-campus-textDim italic">Mentorship opt-in unlocks in Year 2</span>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-campus-card border border-campus-border rounded-xl p-4 shadow-card flex flex-col md:flex-row items-center gap-3">
        {/* Search by interest */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-campus-textDim absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by topic or interest (e.g. Machine Learning, IoT, DevOps)..."
            value={interestSearch}
            onChange={(e) => setInterestSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs text-campus-text placeholder:text-campus-textDim"
          />
        </div>

        {/* Branch Filter dropdown */}
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full md:w-auto px-3 py-2 bg-campus-surface border border-campus-border rounded-lg text-xs text-campus-text font-medium"
        >
          {branches.map((b) => (
            <option key={b} value={b}>
              {b === 'ALL' ? 'All Departments' : b}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Matching available mentors...</span>
        </div>
      ) : mentors.length === 0 ? (
        <div className="p-12 text-center bg-campus-card border border-campus-border rounded-xl">
          <Users className="w-8 h-8 text-campus-textDim mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-campus-text">No matching mentors found</p>
          <span className="text-[11px] text-campus-textMuted">Try expanding your search or selecting all departments.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className={`p-5 bg-campus-card border rounded-xl shadow-card flex flex-col justify-between transition-all ${
                mentor.isSameBranch
                  ? 'border-campus-jade-200 ring-1 ring-campus-jade-100 hover:border-campus-jade-500'
                  : 'border-campus-border hover:border-campus-sage-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-sage-100 text-campus-sage-900">
                    Year {mentor.yearOfStudy} ({mentor.program})
                  </span>
                  {mentor.isSameBranch && (
                    <span className="text-[10px] font-semibold text-campus-jade-700 bg-campus-jade-50 px-2 py-0.5 rounded-full border border-campus-jade-200">
                      Your Department
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-campus-text mb-0.5">{mentor.fullName}</h3>
                <p className="text-[11px] text-campus-textDim mb-2">{mentor.branch}</p>

                {mentor.bio && (
                  <p className="text-xs text-campus-textMuted leading-relaxed mb-3 line-clamp-3">
                    {mentor.bio}
                  </p>
                )}

                {/* Interest Pills */}
                {mentor.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mentor.interests.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-campus-surface border border-campus-borderSubtle px-2 py-0.5 rounded-md text-campus-textMuted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact actions based only on what mentor chose to share */}
              <div className="pt-3 border-t border-campus-borderSubtle flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {mentor.phone && (
                    <a
                      href={`tel:${mentor.phone}`}
                      className="p-1.5 bg-campus-surface rounded-lg text-campus-textMuted hover:text-campus-text"
                      title={mentor.phone}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {mentor.linkedInUrl && (
                    <a
                      href={mentor.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-campus-surface rounded-lg text-campus-textMuted hover:text-campus-jade-700"
                      title="LinkedIn profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {mentor.email ? (
                  <a
                    href={`mailto:${mentor.email}?subject=CampusSync Mentorship Inquiry`}
                    className="px-3 py-1.5 bg-campus-jade-700 text-white rounded-lg text-xs font-semibold hover:bg-campus-jade-800 flex items-center space-x-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact Mentor</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-campus-textDim italic">Email hidden</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
