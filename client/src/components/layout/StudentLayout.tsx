import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Bell,
  Calendar,
  Clock,
  CalendarCheck,
  Book,
  Search,
  Flag,
  Zap,
  Award,
  Users,
  Link as LinkIcon,
  Sparkles,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react';

export interface NavFeature {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const allNavFeatures: NavFeature[] = [
  { name: 'Today', path: '/today', icon: Home },
  { name: 'Announcements', path: '/announcements', icon: Bell },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Deadlines', path: '/deadlines', icon: Clock },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Library', path: '/library', icon: Book },
  { name: 'Lost & Found', path: '/lost-found', icon: Search },
  { name: 'Campus Issues', path: '/campus-issues', icon: Flag },
  { name: 'Opportunities', path: '/opportunities', icon: Zap },
  { name: 'Scholarships', path: '/scholarships', icon: Award },
  { name: 'Clubs', path: '/clubs', icon: Users },
  { name: 'Connect', path: '/connect', icon: LinkIcon },
  { name: 'CampusSync AI', path: '/ai', icon: Sparkles },
];

interface StudentLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children, rightPanel }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Bottom bar items (first 5)
  const bottomBarFeatures = allNavFeatures.slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--color-campus-bg)] text-campus-text p-2 sm:p-4 md:p-6 flex flex-col items-center">
      {/* Outer Floating Rounded Container with subtle margin */}
      <div className="w-full max-w-[1520px] min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] flex flex-col md:flex-row gap-4 relative">
        {/* DESKTOP LEFT ICON RAIL (72px width, 24px radius, soft sage tint) */}
        <aside className="hidden md:flex flex-col items-center w-[72px] bg-[#E5ECE4] rounded-[24px] py-4 px-2.5 justify-between flex-shrink-0 shadow-subtle sticky top-6 h-[calc(100vh-3rem)]">
          {/* Top Brand Mark */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-campus-jade-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm select-none">
              CS
            </div>

            {/* Icon Navigation Buttons */}
            <nav className="flex flex-col items-center gap-2 mt-2 overflow-y-auto no-scrollbar max-h-[calc(100vh-14rem)] py-1">
              {allNavFeatures.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/today' && location.pathname === '/');
                return (
                  <div key={item.path} className="relative group">
                    <NavLink
                      to={item.path}
                      aria-label={item.name}
                      className={({ isActive: active }) =>
                        `w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 outline-hidden focus-visible:ring-2 focus-visible:ring-campus-jade-700 ${
                          active || isActive
                            ? 'bg-campus-jade-700 text-white shadow-card scale-102'
                            : 'bg-white text-campus-textMuted hover:text-campus-text hover:bg-white/90 shadow-subtle'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 stroke-[1.75]" />
                    </NavLink>

                    {/* Tooltip on hover & keyboard focus */}
                    <span className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex px-2.5 py-1 text-[11px] font-medium text-white bg-campus-text rounded-lg whitespace-nowrap shadow-elevated transition-opacity">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Logout at bottom of rail */}
          <div className="relative group pt-2">
            <button
              onClick={logout}
              aria-label="Logout"
              className="w-11 h-11 rounded-full bg-white text-campus-textMuted hover:text-campus-alert-red hover:bg-white/90 flex items-center justify-center shadow-subtle transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-campus-alert-red"
            >
              <LogOut className="w-4 h-4 stroke-[1.75]" />
            </button>
            <span className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex group-focus-within:flex px-2.5 py-1 text-[11px] font-medium text-white bg-campus-text rounded-lg whitespace-nowrap shadow-elevated">
              Logout
            </span>
          </div>
        </aside>

        {/* CENTER CONTENT AREA */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 px-1 sm:px-2 md:px-3">
          <GlobalSearch />
          {children}
        </main>

        {/* RIGHT INFO PANEL (320px width, rounded, shown on Today or when provided, hidden below 1200px) */}
        {rightPanel && (
          <aside className="hidden xl:flex flex-col w-[320px] flex-shrink-0 sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* MOBILE BOTTOM BAR (<768px: 5 items + More button) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-campus-border rounded-full py-2 px-3 flex items-center justify-around shadow-elevated z-40">
        {bottomBarFeatures.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/today' && location.pathname === '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.name}
              className={`p-2.5 rounded-full transition-colors ${
                isActive ? 'bg-campus-jade-700 text-white' : 'text-campus-textMuted hover:text-campus-text'
              }`}
            >
              <Icon className="w-4 h-4" />
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="More navigation items"
          className="p-2.5 rounded-full text-campus-textMuted hover:text-campus-text"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* MOBILE FULL DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative bg-white rounded-t-[28px] p-6 max-h-[85vh] overflow-y-auto shadow-elevated z-10 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-campus-borderSubtle mb-4">
              <span className="font-semibold text-sm text-campus-text">All Destinations</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-full text-campus-textDim hover:bg-campus-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allNavFeatures.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-medium transition-colors ${
                      isActive ? 'bg-campus-jade-700 text-white' : 'bg-campus-surface text-campus-text hover:bg-campus-sage-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="pt-4 mt-4 border-t border-campus-borderSubtle">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-campus-alert-redBg text-campus-alert-red text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
