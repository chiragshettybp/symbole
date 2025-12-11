import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MousePointer, Clock, ArrowDown, ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface HighIntentPage {
  page: string;
  addToCartRate: number;
  avgTimeSpent: number;
  avgScrollDepth: number;
  visits: number;
}

interface HighIntentPagesTableProps {
  data: HighIntentPage[];
  isLoading?: boolean;
}

export const HighIntentPagesTable = ({ data, isLoading = false }: HighIntentPagesTableProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, 10);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getIntentLevel = (rate: number) => {
    if (rate >= 20) return { label: 'Very High', color: 'bg-green-500' };
    if (rate >= 10) return { label: 'High', color: 'bg-blue-500' };
    if (rate >= 5) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-gray-400' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            High-Intent Pages
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Sorted by Add-to-Cart Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MousePointer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No page interaction data yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayData.map((page, index) => {
                const intent = getIntentLevel(page.addToCartRate);
                
                return (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            to={`/admin/analytics/page${page.page}`}
                            className="text-sm font-medium text-foreground hover:text-primary truncate max-w-[250px]"
                          >
                            {page.page}
                          </Link>
                          <Badge className={`${intent.color} text-white text-xs`}>
                            {intent.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <MousePointer className="h-3 w-3" />
                              Add-to-Cart
                            </div>
                            <span className="font-semibold text-green-600">{page.addToCartRate}%</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              Avg. Time
                            </div>
                            <span className="font-medium">{formatTime(page.avgTimeSpent)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <ArrowDown className="h-3 w-3" />
                              Scroll
                            </div>
                            <span className="font-medium">{page.avgScrollDepth}%</span>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Visits</div>
                            <span className="font-medium">{page.visits}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/admin/analytics/page${encodeURIComponent(page.page)}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="mt-3">
                      <Progress 
                        value={Math.min(page.addToCartRate * 5, 100)} 
                        className="h-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {data.length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `Show All (${data.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HighIntentPagesTable;
