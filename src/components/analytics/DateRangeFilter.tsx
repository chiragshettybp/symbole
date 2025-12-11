import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from '@/hooks/useAnalyticsData';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange, customStart?: Date, customEnd?: Date) => void;
  customStart?: Date;
  customEnd?: Date;
}

const presetOptions: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

export const DateRangeFilter = ({
  value,
  onChange,
  customStart,
  customEnd
}: DateRangeFilterProps) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | undefined>(customStart);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(customEnd);

  const handlePresetChange = (newValue: DateRange) => {
    if (newValue === 'custom') {
      setIsCustomOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomApply = () => {
    if (tempStart && tempEnd) {
      onChange('custom', tempStart, tempEnd);
      setIsCustomOpen(false);
    }
  };

  const getDisplayLabel = () => {
    if (value === 'custom' && customStart && customEnd) {
      return `${format(customStart, 'MMM d')} - ${format(customEnd, 'MMM d, yyyy')}`;
    }
    return presetOptions.find(opt => opt.value === value)?.label || 'Select range';
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-36 sm:w-44 h-9">
          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue>{getDisplayLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Calendar
                  mode="single"
                  selected={tempStart}
                  onSelect={setTempStart}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Calendar
                  mode="single"
                  selected={tempEnd}
                  onSelect={setTempEnd}
                  disabled={(date) => date > new Date() || (tempStart && date < tempStart)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsCustomOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCustomApply}
                  disabled={!tempStart || !tempEnd}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateRangeFilter;
