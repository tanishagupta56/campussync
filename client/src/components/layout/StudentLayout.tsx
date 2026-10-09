import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Bell,
  Calendar,
  Clock,
  CalendarCheck,
  Book,
  Search,
  Link as LinkIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export interface NavFeature {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Built features only — adding a future feature requires only adding one entry here
export const studentNavFeatures: NavFeature[] = [
  { name: 'Today', path: '/today', icon: Home },
  { name: 'Announcements', path: '/announcements', icon: Bell },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Deadlines', path: '/deadlines', icon: Clock },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Library', path: '/library', icon: Book },
  { name: 'Lost & Found', path: '/lost-found', icon: Search },
  { name: 'Connect', path: '/connect', icon: LinkIcon },
];

export const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="space-y-1">
      {studentNavFeatures.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-campus-jade-50 text-campus-jade-700 font-semibold shadow-xs'
                  : 'text-campus-textMuted hover:bg-campus-surface hover:text-campus-text'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        );
      })}

      <button
        onClick={() => {
          if (onClick) onClick();
          logout();
        }}
        className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-campus-textMuted hover:bg-campus-alert-redBg hover:text-campus-alert-red transition-colors text-left"
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-campus-card border-b border-campus-border sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-xs">
            CS
          </div>
          <span className="font-bold text-sm tracking-tight text-campus-text">CampusSync</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg border border-campus-border text-campus-textMuted hover:bg-campus-surface"
          aria-label="Toggle Navigation Drawer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-campus-card border-r border-campus-border h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center space-x-2.5 px-2 pb-4 mb-3 border-b border-campus-borderSubtle">
                <div className="w-7 h-7 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-xs">
                  CS
                </div>
                <span className="font-bold text-sm text-campus-text">CampusSync</span>
              </div>
              <NavLinks onClick={() => setMobileOpen(false)} />
            </div>

            <div className="pt-4 border-t border-campus-borderSubtle">
              <div className="text-xs font-semibold text-campus-text truncate">{user?.fullName}</div>
              <div className="text-[11px] text-campus-textMuted truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Flat Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-campus-card border-r border-campus-border min-h-screen sticky top-0 p-3.5 justify-between">
        <div className="overflow-y-auto pr-1">
          <div className="flex items-center space-x-2.5 px-2.5 py-3 mb-3 border-b border-campus-borderSubtle">
            <div className="w-7 h-7 rounded-lg bg-campus-jade-700 flex items-center justify-center text-white font-bold text-xs">
              CS
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-campus-text">CampusSync</div>
              <div className="text-[10px] text-campus-textDim">Student Portal</div>
            </div>
          </div>

          <NavLinks />
        </div>

        <div className="pt-3 border-t border-campus-borderSubtle px-2">
          <div className="text-xs font-semibold text-campus-text truncate">{user?.fullName}</div>
          <div className="text-[11px] text-campus-textDim truncate">{user?.studentProfile?.branch || user?.email}</div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
