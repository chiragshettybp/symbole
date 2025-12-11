import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RecentlyViewedItem {
  productId: string;
  productName: string;
  totalViews: number;
  uniqueViewers: number;
  avgTimeSpent: number;
  repeatViews: number;
}

interface RecentlyViewedTableProps {
  data: RecentlyViewedItem[];
  isLoading?: boolean;
}

export const RecentlyViewedTable = ({ data, isLoading = false }: RecentlyViewedTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // High interest = repeat views > 2 or avgTimeSpent > 60
  const highInterestProducts = data.filter(item => item.repeatViews > 2 || item.avgTimeSpent > 60);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
            <Eye className="h-4 w-4 text-blue-500" />
            Recently Viewed Analytics
          </CardTitle>
          {highInterestProducts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {highInterestProducts.length} high interest
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recently viewed data yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Total Views</TableHead>
                  <TableHead className="text-center">Unique</TableHead>
                  <TableHead className="text-center">Avg. Time</TableHead>
                  <TableHead className="text-center">Repeat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => {
                  const isHighInterest = item.repeatViews > 2 || item.avgTimeSpent > 60;
                  
                  return (
                    <TableRow key={item.productId} className={isHighInterest ? 'bg-yellow-50/50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isHighInterest && (
                            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                          <span className="line-clamp-1 max-w-[180px]">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {item.totalViews}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.uniqueViewers}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatTime(item.avgTimeSpent)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <RefreshCw className="h-3 w-3 text-muted-foreground" />
                          {item.repeatViews}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentlyViewedTable;
