import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface EmptyStateProps {
  /** Large emoji or icon to display */
  icon: string;
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Primary call-to-action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    testId?: string;
    icon?: ReactNode;
  };
  /** Optional secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    testId?: string;
    icon?: ReactNode;
  };
  /** Optional test ID for the container */
  testId?: string;
  /** Optional custom className */
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  testId = "empty-state",
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`text-center py-12 ${className}`} data-testid={testId}>
      <CardContent>
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
        
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-3 justify-center flex-wrap">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                className="flex items-center gap-2"
                data-testid={primaryAction.testId}
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="flex items-center gap-2"
                data-testid={secondaryAction.testId}
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}