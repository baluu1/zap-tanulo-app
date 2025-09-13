import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      variant: {
        base: "border bg-card text-card-foreground shadow-sm",
        interactive: "border bg-card text-card-foreground shadow-sm hover:shadow-lg cursor-pointer group",
        status: "border-l-4 bg-card text-card-foreground shadow-sm",
        metric: "border bg-card text-card-foreground shadow-sm text-center",
      },
      size: {
        default: "",
        compact: "p-4",
        spacious: "p-8",
      }
    },
    defaultVariants: {
      variant: "base",
      size: "default",
    },
  }
);

// Base Standard Card with consistent patterns
interface StandardCardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  testId?: string;
}

export function StandardCard({ 
  variant, 
  size, 
  children, 
  className, 
  onClick, 
  testId 
}: StandardCardProps) {
  return (
    <Card 
      className={cn(cardVariants({ variant, size }), className)}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </Card>
  );
}

// Interactive Card with hover states and actions
interface InteractiveCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
    icon?: ReactNode;
    testId?: string;
  }[];
  onClick?: () => void;
  testId?: string;
  className?: string;
}

export function InteractiveCard({
  title,
  description,
  icon,
  badge,
  actions,
  onClick,
  testId,
  className
}: InteractiveCardProps) {
  return (
    <StandardCard 
      variant="interactive" 
      onClick={onClick}
      testId={testId}
      className={className}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            {icon && (
              <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {badge && (
            <Badge variant={badge.variant || "secondary"}>
              {badge.text}
            </Badge>
          )}
          
          {actions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {actions.map((action, index) => (
                <Button 
                  key={index}
                  variant={action.variant || "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  data-testid={action.testId}
                >
                  {action.icon}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
    </StandardCard>
  );
}

// Metric Card for displaying statistics
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  testId?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  testId,
  className
}: MetricCardProps) {
  return (
    <StandardCard variant="metric" testId={testId} className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {icon}
        </div>
        <div className="text-2xl font-bold text-primary mb-1">{value}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
        {trend && (
          <div className={`text-xs flex items-center gap-1 mt-2 ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-destructive' : 
            'text-muted-foreground'
          }`}>
            {trend.direction === 'up' && '↗'}
            {trend.direction === 'down' && '↘'}
            {trend.direction === 'neutral' && '→'}
            {trend.value}
          </div>
        )}
      </CardContent>
    </StandardCard>
  );
}

// Status Card with colored border indicator
interface StatusCardProps {
  title: string;
  description?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
    testId?: string;
  }[];
  testId?: string;
  className?: string;
}

export function StatusCard({
  title,
  description,
  status,
  actions,
  testId,
  className
}: StatusCardProps) {
  const statusColors = {
    success: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    error: 'border-l-red-500',
    info: 'border-l-blue-500'
  };

  return (
    <StandardCard 
      variant="status" 
      testId={testId} 
      className={cn(statusColors[status], className)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      {actions && (
        <CardFooter className="pt-0">
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                data-testid={action.testId}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardFooter>
      )}
    </StandardCard>
  );
}