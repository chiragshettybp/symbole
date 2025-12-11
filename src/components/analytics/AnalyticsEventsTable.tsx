import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Monitor, Smartphone, Tablet, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsEvent } from '@/hooks/useAnalyticsData';

interface AnalyticsEventsTableProps {
  events: AnalyticsEvent[];
  isLoading?: boolean;
}

const getDeviceIcon = (device: string | null) => {
  switch (device?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const getEventTypeBadge = (type: string) => {
  const variants: Record<string, { color: string; label: string }> = {
    page_view: { color: 'bg-blue-100 text-blue-800', label: 'Page View' },
    click: { color: 'bg-green-100 text-green-800', label: 'Click' },
    scroll: { color: 'bg-yellow-100 text-yellow-800', label: 'Scroll' },
    session_start: { color: 'bg-purple-100 text-purple-800', label: 'Session Start' },
    session_end: { color: 'bg-red-100 text-red-800', label: 'Session End' },
    bounce: { color: 'bg-orange-100 text-orange-800', label: 'Bounce' }
  };

  const variant = variants[type] || { color: 'bg-gray-100 text-gray-800', label: type };
  
  return (
    <Badge className={`${variant.color} border-0 font-medium`}>
      {variant.label}
    </Badge>
  );
};

export const AnalyticsEventsTable = ({ events, isLoading = false }: AnalyticsEventsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.page_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.browser?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    const matchesDevice = deviceFilter === 'all' || event.device_type === deviceFilter;
    
    return matchesSearch && matchesEventType && matchesDevice;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base font-semibold">Engagement Events</CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 h-9 text-sm"
              />
            </div>
            
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="page_view">Page View</SelectItem>
                <SelectItem value="click">Click</SelectItem>
                <SelectItem value="session_start">Session Start</SelectItem>
                <SelectItem value="session_end">Session End</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-28 h-9 text-sm">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No events found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleRow(event.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 text-muted-foreground">
                        {getDeviceIcon(event.device_type)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getEventTypeBadge(event.event_type)}
                          <span className="text-sm font-medium text-foreground truncate">
                            {event.page_url}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                        {event.browser && (
                          <span>{event.browser}</span>
                        )}
                        {event.scroll_depth !== null && event.scroll_depth > 0 && (
                          <span>Scroll: {event.scroll_depth}%</span>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedRows.has(event.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {expandedRows.has(event.id) && (
                    <div className="p-4 bg-muted/30 border-t space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Session ID</p>
                          <p className="font-mono text-xs truncate">{event.session_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Device</p>
                          <p className="capitalize">{event.device_type || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Browser</p>
                          <p>{event.browser || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Session Duration</p>
                          <p>{event.session_duration ? `${event.session_duration}s` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Scroll Depth</p>
                          <p>{event.scroll_depth !== null ? `${event.scroll_depth}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Click Target</p>
                          <p>{event.click_target || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Page Title</p>
                          <p className="truncate">{event.page_title || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
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

export default AnalyticsEventsTable;
