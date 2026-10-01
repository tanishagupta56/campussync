import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, GraduationCap, Calendar, Bell, Clock, Book, Search, Flag, Zap, Award, Users, Link as LinkIcon, Sparkles } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text">
      {/* Temporary minimal shell for Phase 2 auth verification */}
      <nav className="bg-campus-card border-b border-campus-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <div>
            <h1 className="text-sm font-bold text-campus-text">CampusSync</h1>
            <span className="text-xs text-campus-jade-700 font-medium">Student Portal &bull; Today</span>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="p-6 bg-campus-card border border-campus-border rounded-xl shadow-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-campus-jade-50 rounded-lg text-campus-jade-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-campus-text">Student Dashboard — Phase 2 Verified</h2>
              <p className="text-xs text-campus-textMuted">Authentication and role-based routing are active.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-campus-surface rounded-lg border border-campus-borderSubtle">
              <span className="text-[11px] text-campus-textDim uppercase font-semibold">User Role</span>
              <p className="text-sm font-bold text-campus-jade-700 mt-1">{user?.role}</p>
            </div>
            <div className="p-4 bg-campus-surface rounded-lg border border-campus-borderSubtle">
              <span className="text-[11px] text-campus-textDim uppercase font-semibold">College ID</span>
              <p className="text-sm font-semibold text-campus-text mt-1">{user?.studentProfile?.collegeId || 'N/A'}</p>
            </div>
            <div className="p-4 bg-campus-surface rounded-lg border border-campus-borderSubtle">
              <span className="text-[11px] text-campus-textDim uppercase font-semibold">Program / Branch</span>
              <p className="text-sm font-semibold text-campus-text mt-1">{user?.studentProfile?.program} {user?.studentProfile?.branch}</p>
            </div>
            <div className="p-4 bg-campus-surface rounded-lg border border-campus-borderSubtle">
              <span className="text-[11px] text-campus-textDim uppercase font-semibold">Semester / Year</span>
              <p className="text-sm font-semibold text-campus-text mt-1">Sem {user?.studentProfile?.semester} (Year {user?.studentProfile?.yearOfStudy})</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
