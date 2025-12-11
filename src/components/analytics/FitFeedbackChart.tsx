import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ThumbsDown, Check, ThumbsUp } from 'lucide-react';

interface FitFeedback {
  rating: string;
  count: number;
  percentage: number;
}

interface FitFeedbackChartProps {
  data: FitFeedback[];
  isLoading?: boolean;
}

const FIT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  small: { 
    label: 'Runs Small', 
    color: '#ef4444',
    icon: <ThumbsDown className="h-4 w-4" />
  },
  true_to_size: { 
    label: 'True to Size', 
    color: '#22c55e',
    icon: <Check className="h-4 w-4" />
  },
  large: { 
    label: 'Runs Large', 
    color: '#3b82f6',
    icon: <ThumbsUp className="h-4 w-4" />
  }
};

export const FitFeedbackChart = ({ data, isLoading = false }: FitFeedbackChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalFeedback = data.reduce((sum, item) => sum + item.count, 0);
  const trueToSize = data.find(d => d.rating === 'true_to_size');

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Fit & Sizing Feedback</CardTitle>
          <span className="text-xs text-muted-foreground">{totalFeedback} responses</span>
        </div>
      </CardHeader>
      <CardContent>
        {totalFeedback === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground">
            No fit feedback data yet
          </div>
        ) : (
          <>
            {/* Main metric */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-600">
                {trueToSize?.percentage || 0}%
              </div>
              <p className="text-sm text-muted-foreground">True to Size</p>
            </div>

            {/* Fit breakdown */}
            <div className="space-y-4">
              {data.map((item) => {
                const config = FIT_CONFIG[item.rating] || { 
                  label: item.rating, 
                  color: '#6b7280',
                  icon: null
                };
                
                return (
                  <div key={item.rating} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1 rounded"
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          {config.icon}
                        </div>
                        <span className="text-foreground">{config.label}</span>
                      </div>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: config.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendation */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                {trueToSize && trueToSize.percentage >= 70 
                  ? '✓ Most customers find items true to size'
                  : '⚠ Consider updating size guides'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FitFeedbackChart;
