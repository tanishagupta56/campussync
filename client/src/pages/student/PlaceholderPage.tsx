import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState } from '../../components/ui';

interface PlaceholderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  phase?: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  icon: Icon,
  description = 'This module is scheduled in the upcoming build phase. All navigation links are verified and ready.',
  phase = 'Upcoming Module',
}) => {
  return (
    <div className="py-2 space-y-6">
      <PageHeader
        title={title}
        subtitle="University service module interface."
        actions={<Badge label={phase} variant="sage" />}
      />

      <Card tint="tint-1" className="p-8">
        <EmptyState
          icon={Icon}
          title={title}
          description={description}
        />
      </Card>
    </div>
  );
};
