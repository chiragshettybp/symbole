import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ReviewFilter } from '@/hooks/useProductReviews';

interface ReviewFiltersProps {
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

const filterOptions: { value: ReviewFilter; label: string }[] = [
  { value: 'all', label: 'All Reviews' },
  { value: 'verified', label: 'Verified' },
  { value: 'latest', label: 'Latest' },
  { value: 'detailed', label: 'Detailed Reviews' },
];

export const ReviewFilters = ({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  className,
}: ReviewFiltersProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search in reviews"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={cn(filter === option.value && 'bg-accent')}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {filterOptions.slice(1).map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className="rounded-full"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
