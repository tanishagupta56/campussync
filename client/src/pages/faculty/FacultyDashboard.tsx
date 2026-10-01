import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text">
      <nav className="bg-campus-card border-b border-campus-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <div>
            <h1 className="text-sm font-bold text-campus-text">CampusSync</h1>
            <span className="text-xs text-campus-sage-700 font-medium">Faculty Portal</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-campus-text">{user?.fullName}</div>
            <div className="text-[11px] text-campus-textMuted">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-campus-border hover:bg-campus-surface text-xs font-medium text-campus-textMuted"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="p-6 bg-campus-card border border-campus-border rounded-xl shadow-card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-campus-sage-100 rounded-lg text-campus-sage-900">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-campus-text">Faculty Dashboard</h2>
              <p className="text-xs text-campus-textMuted">Welcome, {user?.fullName}. You are authenticated as Faculty.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
