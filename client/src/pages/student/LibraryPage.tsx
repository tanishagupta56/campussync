import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, StatCard, ProgressBar, LoadingSkeleton } from '../../components/ui';
import { Book, RefreshCw, Plus, Minus, Clock, ShieldCheck } from 'lucide-react';
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

  const occupancyVariant: 'jade' | 'amber' | 'blush' =
    !data ? 'jade' :
    data.occupancyPercentage > 85 ? 'blush' :
    data.occupancyPercentage > 60 ? 'amber' :
    'jade';

  const stateBadge =
    !data ? 'Normal' :
    data.occupancyPercentage > 85 ? 'Nearly Full' :
    data.occupancyPercentage > 60 ? 'Filling Up' :
    'Plenty Available';

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title="Central University Library"
        subtitle="Live reading hall occupancy and desk availability monitor."
        actions={
          <button
            type="button"
            onClick={loadLibrary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-campus-textMuted hover:text-campus-text shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {loading && !data ? (
        <LoadingSkeleton rows={3} />
      ) : data ? (
        <div className="space-y-6">
          {/* Main Status Hero Card */}
          <Card tint="tint-1" className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/80 text-campus-jade-700 rounded-2xl shadow-xs">
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-campus-text">{data.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-campus-textDim mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last updated {dayjs(data.lastUpdated).format('h:mm:ss A')}</span>
                  </div>
                </div>
              </div>

              <div className="self-start sm:self-auto">
                <Badge label={stateBadge} variant={occupancyVariant} />
              </div>
            </div>

            {/* Three Primary Stat Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Available Seats"
                value={data.available}
                subtext="Ready for study"
                tint="default"
              />
              <StatCard
                label="Currently Occupied"
                value={data.occupied}
                subtext="Students inside reading hall"
                tint="default"
              />
              <StatCard
                label="Total Capacity"
                value={data.capacity}
                subtext="Maximum reading desks"
                tint="default"
              />
            </div>

            {/* Hall Density Progress Bar */}
            <div className="bg-white/80 p-4 rounded-[18px]">
              <ProgressBar
                percentage={data.occupancyPercentage}
                label="Reading Hall Density"
                variant={occupancyVariant}
              />
            </div>

            {/* Administrator Gate Controls */}
            {isAdmin && (
              <div className="mt-6 pt-5 border-t border-black/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-campus-text mb-1">
                  <ShieldCheck className="w-4 h-4 text-campus-jade-700" />
                  <span>Administrator Gate Turnstile Controls</span>
                </div>
                <p className="text-xs text-campus-textMuted mb-3">
                  Authorized gate operator controls. Enforced with server-side permission checks.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={updating || data.occupied <= 0}
                    onClick={() => updateOccupancy(-1)}
                    className="px-4 py-2 bg-white rounded-full text-xs font-medium text-campus-text hover:bg-campus-surface shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Student Exit (-1)</span>
                  </button>
                  <button
                    type="button"
                    disabled={updating || data.occupied >= data.capacity}
                    onClick={() => updateOccupancy(1)}
                    className="px-4 py-2 bg-campus-text text-white rounded-full text-xs font-medium hover:bg-black shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Student Entry (+1)</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
};
