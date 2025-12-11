import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnalyticsKPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
}

export const AnalyticsKPICard = ({
  title,
  value,
  trend,
  trendLabel = 'vs previous period',
  icon,
  isLoading = false,
  className,
  valueClassName
}: AnalyticsKPICardProps) => {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    return trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card border-border hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        
        <div className={cn("text-2xl sm:text-3xl font-bold text-foreground mb-2", valueClassName)}>
          {value}
        </div>
        
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-muted-foreground ml-1">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsKPICard;
