import { cn } from '@/lib/utils';

interface RatingDistributionProps {
  distribution: { [key: number]: number };
  total: number;
  className?: string;
}

export const RatingDistribution = ({
  distribution,
  total,
  className,
}: RatingDistributionProps) => {
  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return (count / total) * 100;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((star) => (
        <div key={star} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-3">{star}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${getPercentage(distribution[star])}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
