import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { Card, Badge, StatCard, LoadingSkeleton, MiniBarChart } from '../../components/ui';
import {
  Bell, Calendar, Clock, Zap, Award, Users, Search, Flag, GraduationCap,
} from 'lucide-react';

interface OverviewData {
  counts: {
    announcements: number;
    events: number;
    deadlines: number;
    opportunities: number;
    scholarships: number;
    clubs: number;
    students: number;
    activeLostItems: number;
  };
  issueChart: { label: string; value: number }[];
}

export const AdminOverviewPanel: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<OverviewData>('/api/admin/overview')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: 'Students', value: data.counts.students, icon: GraduationCap, tint: 'tint-1' as const },
        { label: 'Announcements', value: data.counts.announcements, icon: Bell, tint: 'tint-2' as const },
        { label: 'Events', value: data.counts.events, icon: Calendar, tint: 'tint-3' as const },
        { label: 'Active Deadlines', value: data.counts.deadlines, icon: Clock, tint: 'tint-4' as const },
        { label: 'Opportunities', value: data.counts.opportunities, icon: Zap, tint: 'tint-1' as const },
        { label: 'Scholarships', value: data.counts.scholarships, icon: Award, tint: 'tint-2' as const },
        { label: 'Clubs', value: data.counts.clubs, icon: Users, tint: 'tint-3' as const },
        { label: 'Lost Items (Active)', value: data.counts.activeLostItems, icon: Search, tint: 'tint-4' as const },
      ]
    : [];

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Flag className="w-4 h-4 text-campus-jade-700" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-campus-textDim">Platform Overview</h3>
      </div>

      {/* StatCards grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} tint={s.tint} className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-campus-jade-700" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-campus-textDim">
                  {s.label}
                </span>
              </div>
              <div className="text-2xl font-light tracking-tight text-campus-text">{s.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Campus Issues by Status chart */}
      {data && data.issueChart.length > 0 && (
        <Card tint="default" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-3.5 h-3.5 text-campus-jade-700" />
            <span className="text-xs font-medium text-campus-text">Campus Issues by Status</span>
          </div>
          <MiniBarChart
            data={data.issueChart.map(d => ({ label: d.label, value: d.value }))}
            targetValue={-1}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {data.issueChart.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <Badge
                  label={`${d.label}: ${d.value}`}
                  variant={
                    d.label === 'RESOLVED' ? 'jade' :
                    d.label.includes('PROGRESS') ? 'amber' : 'blush'
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {data && data.issueChart.length === 0 && (
        <Card tint="tint-1" className="p-4 text-center">
          <Flag className="w-6 h-6 text-campus-textDim mx-auto mb-2 opacity-40" />
          <p className="text-xs text-campus-textMuted">No campus issues reported yet.</p>
        </Card>
      )}
    </div>
  );
};
