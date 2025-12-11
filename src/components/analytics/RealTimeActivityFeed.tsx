import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Activity, Eye, MousePointer, LogIn, LogOut, ArrowDown, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface LiveEvent {
  id: string;
  event_type: string;
  page_url: string;
  device_type: string | null;
  browser: string | null;
  created_at: string;
  click_target: string | null;
  scroll_depth: number | null;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'page_view':
      return <Eye className="h-4 w-4 text-blue-500" />;
    case 'click':
      return <MousePointer className="h-4 w-4 text-green-500" />;
    case 'session_start':
      return <LogIn className="h-4 w-4 text-purple-500" />;
    case 'session_end':
      return <LogOut className="h-4 w-4 text-red-500" />;
    case 'scroll':
      return <ArrowDown className="h-4 w-4 text-yellow-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getEventDescription = (event: LiveEvent) => {
  switch (event.event_type) {
    case 'page_view':
      return `Viewed ${event.page_url}`;
    case 'click':
      return `Clicked on ${event.click_target || 'element'} at ${event.page_url}`;
    case 'session_start':
      return `New session started on ${event.device_type || 'device'}`;
    case 'session_end':
      return `Session ended (${event.scroll_depth || 0}% scrolled)`;
    case 'scroll':
      return `Scrolled to ${event.scroll_depth}% on ${event.page_url}`;
    default:
      return `${event.event_type} on ${event.page_url}`;
  }
};

interface RealTimeActivityFeedProps {
  initialEvents?: LiveEvent[];
  isLoading?: boolean;
}

export const RealTimeActivityFeed = ({ initialEvents = [], isLoading = false }: RealTimeActivityFeedProps) => {
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setEvents(initialEvents.slice(0, 50));
  }, [initialEvents]);

  // Real-time subscription
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('realtime-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        (payload) => {
          const newEvent = payload.new as LiveEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <button 
              onClick={() => setIsLive(!isLive)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLive ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-6 space-y-1">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">Events will appear here in real-time</p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 py-3 ${
                    index < events.length - 1 ? 'border-b border-border/50' : ''
                  } ${index === 0 ? 'animate-fade-in' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-muted">
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {getEventDescription(event)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'HH:mm:ss')}
                      </span>
                      {event.device_type && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {event.device_type}
                        </Badge>
                      )}
                      {event.browser && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5">
                          {event.browser}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealTimeActivityFeed;
