import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Users, Clock, MousePointer, ArrowDown, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsKPICard } from '@/components/analytics/AnalyticsKPICard';
import { AnalyticsLineChart, AnalyticsBarChart } from '@/components/analytics/AnalyticsChart';
import { AnalyticsEventsTable } from '@/components/analytics/AnalyticsEventsTable';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/hooks/useAnalyticsData';

interface PageMetrics {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  clickCount: number;
  bounceRate: number;
}

interface TimeSeriesPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface ClickTarget {
  target: string;
  count: number;
  percentage: number;
}

const getDateRangeFilter = (range: DateRange, customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    case '7days':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      return { start: week, end: now };
    case '30days':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      return { start: month, end: now };
    case 'thisMonth':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    case 'custom':
      return { start: customStart || today, end: customEnd || now };
    default:
      return { start: today, end: now };
  }
};

const AdminPageAnalytics = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  
  const [metrics, setMetrics] = useState<PageMetrics>({
    totalViews: 0,
    uniqueVisitors: 0,
    avgTimeOnPage: 0,
    avgScrollDepth: 0,
    clickCount: 0,
    bounceRate: 0
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [clickTargets, setClickTargets] = useState<ClickTarget[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const decodedSlug = slug ? decodeURIComponent(slug) : '/';
  const pageUrl = decodedSlug.startsWith('/') ? decodedSlug : `/${decodedSlug}`;

  const fetchPageAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRangeFilter(dateRange, customStart, customEnd);

      // Fetch all events for this page
      const { data: pageEvents, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('page_url', pageUrl)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsData = pageEvents || [];
      
      // Calculate metrics
      const pageViews = eventsData.filter(e => e.event_type === 'page_view');
      const clicks = eventsData.filter(e => e.event_type === 'click');
      const sessions = [...new Set(eventsData.map(e => e.session_id))];
      
      // Session durations
      const durations = eventsData
        .filter(e => e.session_duration && e.session_duration > 0)
        .map(e => e.session_duration as number);
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      // Scroll depths
      const scrolls = eventsData
        .filter(e => e.scroll_depth && e.scroll_depth > 0)
        .map(e => e.scroll_depth as number);
      const avgScroll = scrolls.length > 0
        ? scrolls.reduce((a, b) => a + b, 0) / scrolls.length
        : 0;

      // Bounce rate (sessions with only one event on this page)
      const sessionEventCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        sessionEventCounts[e.session_id] = (sessionEventCounts[e.session_id] || 0) + 1;
      });
      const bouncedSessions = Object.values(sessionEventCounts).filter(v => v === 1).length;
      const bounceRate = sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0;

      setMetrics({
        totalViews: pageViews.length,
        uniqueVisitors: sessions.length,
        avgTimeOnPage: Math.round(avgDuration),
        avgScrollDepth: Math.round(avgScroll),
        clickCount: clicks.length,
        bounceRate: Math.round(bounceRate * 10) / 10
      });

      // Time series data
      const dateMap: Record<string, { views: number; sessions: Set<string> }> = {};
      eventsData.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dateMap[date]) {
          dateMap[date] = { views: 0, sessions: new Set() };
        }
        if (event.event_type === 'page_view') {
          dateMap[date].views++;
        }
        dateMap[date].sessions.add(event.session_id);
      });

      setTimeSeriesData(
        Object.entries(dateMap)
          .map(([date, data]) => ({
            date,
            views: data.views,
            uniqueVisitors: data.sessions.size
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      // Click targets breakdown
      const targetCounts: Record<string, number> = {};
      clicks.forEach(e => {
        const target = e.click_target || 'unknown';
        targetCounts[target] = (targetCounts[target] || 0) + 1;
      });
      const totalClicks = Object.values(targetCounts).reduce((a, b) => a + b, 0);
      setClickTargets(
        Object.entries(targetCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([target, count]) => ({
            target,
            count,
            percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0
          }))
      );

      // Recent events for table
      setEvents(eventsData.slice(0, 100));

    } catch (error) {
      console.error('Error fetching page analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch page analytics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageUrl, dateRange, customStart, customEnd, toast]);

  useEffect(() => {
    fetchPageAnalytics();
  }, [fetchPageAnalytics]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('page-analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        (payload) => {
          const newEvent = payload.new as any;
          if (newEvent.page_url === pageUrl) {
            setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
            if (newEvent.event_type === 'page_view') {
              setMetrics(prev => ({
                ...prev,
                totalViews: prev.totalViews + 1
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageUrl]);

  const handleDateRangeChange = (range: DateRange, start?: Date, end?: Date) => {
    setDateRange(range);
    if (start) setCustomStart(start);
    if (end) setCustomEnd(end);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link to="/admin/analytics" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Analytics
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Page Analytics</h1>
              <p className="text-muted-foreground mt-1 font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                {pageUrl}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <DateRangeFilter
                value={dateRange}
                onChange={handleDateRangeChange}
                customStart={customStart}
                customEnd={customEnd}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchPageAnalytics}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AnalyticsKPICard
            title="Page Views"
            value={metrics.totalViews.toLocaleString()}
            icon={<Eye className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Unique Visitors"
            value={metrics.uniqueVisitors.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Avg. Time on Page"
            value={formatDuration(metrics.avgTimeOnPage)}
            icon={<Clock className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Avg. Scroll Depth"
            value={`${metrics.avgScrollDepth}%`}
            icon={<ArrowDown className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Click Events"
            value={metrics.clickCount.toLocaleString()}
            icon={<MousePointer className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Bounce Rate"
            value={`${metrics.bounceRate}%`}
            icon={<ArrowLeft className="h-5 w-5" />}
            isLoading={isLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsLineChart
            title="Views Over Time"
            data={timeSeriesData}
            dataKey="views"
            strokeColor="#3b82f6"
            showArea
            isLoading={isLoading}
            className="lg:col-span-2"
          />

          {clickTargets.length > 0 && (
            <AnalyticsBarChart
              title="Click Targets"
              data={clickTargets}
              dataKey="count"
              nameKey="target"
              fillColor="#10b981"
              layout="vertical"
              isLoading={isLoading}
            />
          )}

          {/* Scroll Depth Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Engagement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Scroll Depth</span>
                    <div className="flex-1 mx-4 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${metrics.avgScrollDepth}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{metrics.avgScrollDepth}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bounce Rate</span>
                    <div className="flex-1 mx-4 bg-muted rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${metrics.bounceRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{metrics.bounceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Click Rate</span>
                    <div className="flex-1 mx-4 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((metrics.clickCount / Math.max(metrics.totalViews, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {metrics.totalViews > 0 
                        ? Math.round((metrics.clickCount / metrics.totalViews) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <AnalyticsEventsTable events={events} isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
};

export default AdminPageAnalytics;
