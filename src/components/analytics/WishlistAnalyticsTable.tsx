import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ExternalLink, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WishlistItem {
  productId: string;
  productName: string;
  addedCount: number;
  convertedCount: number;
  conversionRate: number;
}

interface WishlistAnalyticsTableProps {
  data: WishlistItem[];
  isLoading?: boolean;
}

export const WishlistAnalyticsTable = ({ data, isLoading = false }: WishlistAnalyticsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary stats
  const totalAdded = data.reduce((sum, item) => sum + item.addedCount, 0);
  const totalConverted = data.reduce((sum, item) => sum + item.convertedCount, 0);
  const overallConversionRate = totalAdded > 0 ? Math.round((totalConverted / totalAdded) * 100) : 0;

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
            <Heart className="h-4 w-4 text-red-500" />
            Wishlist Analytics
          </CardTitle>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{totalAdded}</p>
            <p className="text-xs text-muted-foreground">Total Added</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{totalConverted}</p>
            <p className="text-xs text-muted-foreground">Converted to Cart</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{overallConversionRate}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No wishlist data yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Added</TableHead>
                  <TableHead className="text-center">Converted</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1 max-w-[200px]">{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.addedCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ShoppingCart className="h-3 w-3 text-green-500" />
                        {item.convertedCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={item.conversionRate >= 50 ? "default" : "secondary"}
                        className={item.conversionRate >= 50 ? "bg-green-500" : ""}
                      >
                        {item.conversionRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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

export default WishlistAnalyticsTable;
