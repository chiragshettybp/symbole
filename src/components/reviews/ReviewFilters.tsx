import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ReviewFilter } from '@/hooks/useProductReviews';
interface ReviewFiltersProps {
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}
const filterOptions: {
  value: ReviewFilter;
  label: string;
}[] = [{
  value: 'all',
  label: 'All Reviews'
}, {
  value: 'verified',
  label: 'Verified'
}, {
  value: 'latest',
  label: 'Latest'
}, {
  value: 'detailed',
  label: 'Detailed Reviews'
}];
export const ReviewFilters = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  className
}: ReviewFiltersProps) => {
  return <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        
        
      </div>

      {/* Filter Chips */}
      
    </div>;
};