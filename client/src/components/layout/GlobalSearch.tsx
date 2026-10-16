import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/apiClient';
import { Search, X, Bell, Calendar, Clock, Zap, Award, Users, SearchX } from 'lucide-react';

interface SearchResult {
  type: 'ANNOUNCEMENT' | 'EVENT' | 'DEADLINE' | 'OPPORTUNITY' | 'SCHOLARSHIP' | 'CLUB' | 'LOST_ITEM';
  id: string;
  title: string;
  subtitle: string;
  path: string;
  date: string | null;
}

const typeConfig: Record<SearchResult['type'], { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ANNOUNCEMENT: { label: 'Announcement', icon: Bell, color: 'bg-campus-sage-100 text-campus-sage-900' },
  EVENT: { label: 'Event', icon: Calendar, color: 'bg-campus-jade-50 text-campus-jade-700' },
  DEADLINE: { label: 'Deadline', icon: Clock, color: 'bg-campus-alert-amberBg text-campus-alert-amber' },
  OPPORTUNITY: { label: 'Opportunity', icon: Zap, color: 'bg-[var(--card-tint-3)] text-campus-text' },
  SCHOLARSHIP: { label: 'Scholarship', icon: Award, color: 'bg-campus-alert-redBg text-campus-alert-red' },
  CLUB: { label: 'Club', icon: Users, color: 'bg-[var(--card-tint-2)] text-campus-text' },
  LOST_ITEM: { label: 'Lost Item', icon: Search, color: 'bg-campus-surface text-campus-textDim' },
};

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiRequest<{ results: SearchResult[]; query: string }>(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        setResults(data.results);
        setOpen(true);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(result: SearchResult) {
    navigate(result.path);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  // Group results by type
  const grouped: Partial<Record<SearchResult['type'], SearchResult[]>> = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type]!.push(r);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto mb-4 md:mb-6">
      <div className="relative">
        <Search className="w-4 h-4 text-campus-textDim absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search announcements, events, deadlines, clubs, scholarships…"
          className="w-full pl-10 pr-10 py-2.5 bg-white rounded-full text-xs text-campus-text placeholder:text-campus-textDim shadow-subtle border-none outline-hidden focus:ring-2 focus:ring-campus-jade-700 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-campus-textDim hover:text-campus-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-[20px] shadow-elevated z-50 overflow-hidden max-h-[420px] overflow-y-auto border border-campus-borderSubtle">
          {loading ? (
            <div className="p-4 text-center text-xs text-campus-textMuted animate-pulse">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-6 flex flex-col items-center gap-2 text-campus-textMuted">
              <SearchX className="w-6 h-6" />
              <span className="text-xs">No results for "{query}"</span>
            </div>
          ) : (
            <div className="p-2">
              {(Object.entries(grouped) as [SearchResult['type'], SearchResult[]][]).map(([type, items]) => {
                const cfg = typeConfig[type];
                const Icon = cfg.icon;
                return (
                  <div key={type} className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-campus-textDim">
                      {cfg.label}s
                    </div>
                    {items.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-campus-surface text-left transition-colors group"
                      >
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-campus-text truncate group-hover:text-campus-jade-700">
                            {r.title}
                          </div>
                          {r.subtitle && (
                            <div className="text-[10px] text-campus-textDim truncate">{r.subtitle}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
