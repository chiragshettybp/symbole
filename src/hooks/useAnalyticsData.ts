import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalyticsKPIs {
  totalVisits: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  clickThroughRate: number;
  avgScrollDepth: number;
  totalVisitsTrend: number;
  uniqueVisitorsTrend: number;
  sessionDurationTrend: number;
  bounceRateTrend: number;
}

export interface TimeSeriesData {
  date: string;
  visits: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface DeviceData {
  name: string;
  value: number;
  percentage: number;
}

export interface PageData {
  page: string;
  visits: number;
  percentage: number;
}

export interface AnalyticsEvent {
  id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  page_title: string | null;
  device_type: string | null;
  browser: string | null;
  scroll_depth: number | null;
  session_duration: number | null;
  click_target: string | null;
  created_at: string;
}

export type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'custom';

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
      return { 
        start: customStart || today, 
        end: customEnd || now 
      };
    default:
      return { start: today, end: now };
  }
};

export const useAnalyticsData = (dateRange: DateRange = '7days', customStart?: Date, customEnd?: Date) => {
  const [kpis, setKpis] = useState<AnalyticsKPIs>({
    totalVisits: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    clickThroughRate: 0,
    avgScrollDepth: 0,
    totalVisitsTrend: 0,
    uniqueVisitorsTrend: 0,
    sessionDurationTrend: 0,
    bounceRateTrend: 0
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [browserData, setBrowserData] = useState<DeviceData[]>([]);
  const [topLandingPages, setTopLandingPages] = useState<PageData[]>([]);
  const [topExitPages, setTopExitPages] = useState<PageData[]>([]);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRangeFilter(dateRange, customStart, customEnd);
      
      // Fetch all events in date range
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsData = events || [];
      
      // Calculate KPIs
      const pageViews = eventsData.filter(e => e.event_type === 'page_view');
      const sessions = [...new Set(eventsData.map(e => e.session_id))];
      const clicks = eventsData.filter(e => e.event_type === 'click');
      const productClicks = clicks.filter(e => e.click_target === 'product_thumbnail');
      
      // Calculate session durations
      const sessionDurations = eventsData
        .filter(e => e.session_duration && e.session_duration > 0)
        .map(e => e.session_duration as number);
      const avgDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;
      
      // Calculate bounce rate (sessions with only one page view)
      const sessionPageViews: Record<string, number> = {};
      pageViews.forEach(e => {
        sessionPageViews[e.session_id] = (sessionPageViews[e.session_id] || 0) + 1;
      });
      const bouncedSessions = Object.values(sessionPageViews).filter(v => v === 1).length;
      const bounceRate = sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0;
      
      // Calculate scroll depth
      const scrollDepths = eventsData
        .filter(e => e.scroll_depth && e.scroll_depth > 0)
        .map(e => e.scroll_depth as number);
      const avgScrollDepth = scrollDepths.length > 0
        ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
        : 0;
      
      // CTR
      const ctr = pageViews.length > 0 ? (productClicks.length / pageViews.length) * 100 : 0;

      // Calculate trends (compare to previous period)
      const periodLength = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = start;

      const { data: prevEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', prevEnd.toISOString());

      const prevEventsData = prevEvents || [];
      const prevPageViews = prevEventsData.filter(e => e.event_type === 'page_view');
      const prevSessions = [...new Set(prevEventsData.map(e => e.session_id))];

      const visitsTrend = prevPageViews.length > 0 
        ? ((pageViews.length - prevPageViews.length) / prevPageViews.length) * 100 
        : 0;
      const visitorsTrend = prevSessions.length > 0 
        ? ((sessions.length - prevSessions.length) / prevSessions.length) * 100 
        : 0;

      setKpis({
        totalVisits: pageViews.length,
        uniqueVisitors: sessions.length,
        avgSessionDuration: Math.round(avgDuration),
        bounceRate: Math.round(bounceRate * 10) / 10,
        clickThroughRate: Math.round(ctr * 10) / 10,
        avgScrollDepth: Math.round(avgScrollDepth),
        totalVisitsTrend: Math.round(visitsTrend * 10) / 10,
        uniqueVisitorsTrend: Math.round(visitorsTrend * 10) / 10,
        sessionDurationTrend: 0,
        bounceRateTrend: 0
      });

      // Time series data
      const dateMap: Record<string, { visits: number; sessions: Set<string>; bounces: number; durations: number[] }> = {};
      
      eventsData.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!dateMap[date]) {
          dateMap[date] = { visits: 0, sessions: new Set(), bounces: 0, durations: [] };
        }
        if (event.event_type === 'page_view') {
          dateMap[date].visits++;
        }
        dateMap[date].sessions.add(event.session_id);
        if (event.session_duration) {
          dateMap[date].durations.push(event.session_duration);
        }
      });

      const timeSeries: TimeSeriesData[] = Object.entries(dateMap)
        .map(([date, data]) => ({
          date,
          visits: data.visits,
          uniqueVisitors: data.sessions.size,
          bounceRate: 0,
          avgSessionDuration: data.durations.length > 0 
            ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
            : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTimeSeriesData(timeSeries);

      // Device breakdown
      const deviceCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        const device = e.device_type || 'unknown';
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });
      const totalDeviceEvents = Object.values(deviceCounts).reduce((a, b) => a + b, 0);
      setDeviceData(Object.entries(deviceCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: totalDeviceEvents > 0 ? Math.round((value / totalDeviceEvents) * 100) : 0
      })));

      // Browser breakdown
      const browserCounts: Record<string, number> = {};
      eventsData.forEach(e => {
        const browser = e.browser || 'unknown';
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      });
      const totalBrowserEvents = Object.values(browserCounts).reduce((a, b) => a + b, 0);
      setBrowserData(Object.entries(browserCounts).map(([name, value]) => ({
        name,
        value,
        percentage: totalBrowserEvents > 0 ? Math.round((value / totalBrowserEvents) * 100) : 0
      })));

      // Top landing pages (first page view per session)
      const landingPages: Record<string, number> = {};
      const sessionFirstView: Record<string, string> = {};
      pageViews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      pageViews.forEach(e => {
        if (!sessionFirstView[e.session_id]) {
          sessionFirstView[e.session_id] = e.page_url;
          landingPages[e.page_url] = (landingPages[e.page_url] || 0) + 1;
        }
      });
      const totalLandings = Object.values(landingPages).reduce((a, b) => a + b, 0);
      setTopLandingPages(
        Object.entries(landingPages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([page, visits]) => ({
            page,
            visits,
            percentage: totalLandings > 0 ? Math.round((visits / totalLandings) * 100) : 0
          }))
      );

      // Top exit pages (last page view per session)
      const exitPages: Record<string, number> = {};
      const sessionLastView: Record<string, string> = {};
      pageViews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      pageViews.forEach(e => {
        if (!sessionLastView[e.session_id]) {
          sessionLastView[e.session_id] = e.page_url;
          exitPages[e.page_url] = (exitPages[e.page_url] || 0) + 1;
        }
      });
      const totalExits = Object.values(exitPages).reduce((a, b) => a + b, 0);
      setTopExitPages(
        Object.entries(exitPages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([page, visits]) => ({
            page,
            visits,
            percentage: totalExits > 0 ? Math.round((visits / totalExits) * 100) : 0
          }))
      );

      // Recent events
      setRecentEvents(eventsData.slice(0, 100) as AnalyticsEvent[]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStart, customEnd, toast]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        (payload) => {
          const newEvent = payload.new as AnalyticsEvent;
          setRecentEvents(prev => [newEvent, ...prev.slice(0, 99)]);
          
          // Update KPIs incrementally for page views
          if (newEvent.event_type === 'page_view') {
            setKpis(prev => ({
              ...prev,
              totalVisits: prev.totalVisits + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    kpis,
    timeSeriesData,
    deviceData,
    browserData,
    topLandingPages,
    topExitPages,
    recentEvents,
    isLoading,
    refetch: fetchAnalytics
  };
};

export default useAnalyticsData;
