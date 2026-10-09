import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Book, RefreshCw, Plus, Minus, Clock, ShieldCheck, Users } from 'lucide-react';
import dayjs from 'dayjs';

interface LibraryData {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancyPercentage: number;
  lastUpdated: string;
}

export const LibraryPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const isAdmin = user?.role === 'ADMINISTRATOR';

  async function loadLibrary() {
    setLoading(true);
    try {
      const res = await apiRequest<LibraryData>('/api/library');
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load library status', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  async function updateOccupancy(delta: number) {
    if (!isAdmin || !data) return;
    setUpdating(true);
    try {
      const updated = await apiRequest<LibraryData>('/api/library', {
        method: 'PATCH',
        body: JSON.stringify({ delta }),
      });
      setData(updated);
      showToast(delta > 0 ? 'Recorded +1 student entry' : 'Recorded -1 student exit', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update occupancy', 'error');
    } finally {
      setUpdating(false);
    }
  }

  const occupancyColor =
    !data ? 'text-campus-jade-700' :
    data.occupancyPercentage > 85 ? 'text-campus-alert-red' :
    data.occupancyPercentage > 60 ? 'text-campus-alert-amber' :
    'text-campus-jade-700';

  const barColor =
    !data ? 'bg-campus-jade-700' :
    data.occupancyPercentage > 85 ? 'bg-campus-alert-red' :
    data.occupancyPercentage > 60 ? 'bg-campus-alert-amber' :
    'bg-campus-jade-700';

  const stateBadge =
    !data ? 'Normal' :
    data.occupancyPercentage > 85 ? 'Nearly Full' :
    data.occupancyPercentage > 60 ? 'Filling Up' :
    'Plenty Available';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-campus-border gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-campus-text">Central University Library</h1>
          <p className="text-xs text-campus-textMuted mt-0.5">Live reading hall occupancy and desk availability monitor.</p>
        </div>
        <button
          onClick={loadLibrary}
          className="self-start md:self-auto px-3 py-1.5 border border-campus-border rounded-lg text-xs text-campus-textMuted hover:text-campus-text flex items-center space-x-1.5 hover:bg-campus-surface transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 text-campus-jade-700 animate-spin" />
          <span className="text-xs text-campus-textMuted">Reading sensor telemetry...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Main Status Hero */}
          <div className="bg-campus-card border border-campus-border rounded-xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-campus-sage-100 text-campus-jade-700 rounded-xl">
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-campus-text">{data.name}</h2>
                  <div className="flex items-center space-x-2 text-xs text-campus-textDim mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last updated {dayjs(data.lastUpdated).format('h:mm:ss A')}</span>
                  </div>
                </div>
              </div>

              <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border ${
                data.occupancyPercentage > 85 ? 'bg-campus-alert-redBg text-campus-alert-red border-campus-alert-redBorder' :
                data.occupancyPercentage > 60 ? 'bg-campus-alert-amberBg text-campus-alert-amber border-campus-alert-amberBorder' :
                'bg-campus-jade-50 text-campus-jade-700 border-campus-jade-200'
              }`}>
                {stateBadge}
              </span>
            </div>

            {/* Three Primary Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-campus-surface rounded-xl border border-campus-borderSubtle">
                <span className="text-xs text-campus-textDim uppercase font-semibold">Available Seats</span>
                <p className="text-3xl font-extrabold text-campus-jade-700 mt-1">{data.available}</p>
                <span className="text-[11px] text-campus-textMuted mt-1 block">Ready for study</span>
              </div>
              <div className="p-4 bg-campus-surface rounded-xl border border-campus-borderSubtle">
                <span className="text-xs text-campus-textDim uppercase font-semibold">Currently Occupied</span>
                <p className={`text-3xl font-extrabold mt-1 ${occupancyColor}`}>{data.occupied}</p>
                <span className="text-[11px] text-campus-textMuted mt-1 block">Students inside</span>
              </div>
              <div className="p-4 bg-campus-surface rounded-xl border border-campus-borderSubtle">
                <span className="text-xs text-campus-textDim uppercase font-semibold">Total Capacity</span>
                <p className="text-3xl font-extrabold text-campus-text mt-1">{data.capacity}</p>
                <span className="text-[11px] text-campus-textMuted mt-1 block">Maximum reading desks</span>
              </div>
            </div>

            {/* Occupancy bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-campus-textMuted">Hall Density</span>
                <span className={occupancyColor}>{data.occupancyPercentage}% Occupied</span>
              </div>
              <div className="w-full bg-campus-borderSubtle h-3 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${data.occupancyPercentage}%` }} />
              </div>
            </div>

            {/* Administrator Only Controls */}
            {isAdmin && (
              <div className="mt-6 pt-5 border-t border-campus-borderSubtle bg-campus-sage-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex items-center space-x-2 text-xs font-bold text-campus-jade-900 mb-2">
                  <ShieldCheck className="w-4 h-4 text-campus-jade-700" />
                  <span>Administrator Gate Turnstile Controls</span>
                </div>
                <p className="text-xs text-campus-textMuted mb-3">
                  Authorized gate operator controls. Non-administrators cannot see or invoke these endpoints (enforced with 403 checks).
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    disabled={updating || data.occupied <= 0}
                    onClick={() => updateOccupancy(-1)}
                    className="px-4 py-2 bg-white border border-campus-border rounded-lg text-xs font-semibold text-campus-text hover:bg-campus-surface flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Student Exit (-1)</span>
                  </button>
                  <button
                    disabled={updating || data.occupied >= data.capacity}
                    onClick={() => updateOccupancy(1)}
                    className="px-4 py-2 bg-campus-jade-700 rounded-lg text-xs font-semibold text-white hover:bg-campus-jade-800 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Student Entry (+1)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
