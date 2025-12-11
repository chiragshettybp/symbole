import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface PageData {
  page: string;
  visits: number;
  percentage: number;
}

interface ClickablePagesListProps {
  title: string;
  pages: PageData[];
  isLoading?: boolean;
  color?: string;
}

export const ClickablePagesList = ({
  title,
  pages,
  isLoading = false,
  color = '#3b82f6'
}: ClickablePagesListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <div className="space-y-4">
            {pages.map((page, index) => (
              <Link
                key={index}
                to={`/admin/analytics/page/${encodeURIComponent(page.page)}`}
                className="block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] flex items-center gap-1">
                    {page.page}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {page.visits} ({page.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={page.percentage} 
                  className="h-2"
                  style={{ 
                    ['--progress-background' as string]: color 
                  }}
                />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClickablePagesList;
