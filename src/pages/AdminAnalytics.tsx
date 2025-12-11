import { useState } from 'react';
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingDown, 
  MousePointer, 
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { AnalyticsKPICard } from '@/components/analytics/AnalyticsKPICard';
import { 
  AnalyticsLineChart, 
  AnalyticsMultiLineChart,
  AnalyticsBarChart, 
  AnalyticsPieChart 
} from '@/components/analytics/AnalyticsChart';
import { AnalyticsEventsTable } from '@/components/analytics/AnalyticsEventsTable';
import { RealTimeActivityFeed } from '@/components/analytics/RealTimeActivityFeed';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { useAnalyticsData, DateRange } from '@/hooks/useAnalyticsData';

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();

  const {
    kpis,
    timeSeriesData,
    deviceData,
    browserData,
    topLandingPages,
    topExitPages,
    recentEvents,
    isLoading,
    refetch
  } = useAnalyticsData(dateRange, customStart, customEnd);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Website traffic and user engagement insights</p>
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
              onClick={refetch}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AnalyticsKPICard
            title="Total Visits"
            value={kpis.totalVisits.toLocaleString()}
            trend={kpis.totalVisitsTrend}
            icon={<Eye className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Unique Visitors"
            value={kpis.uniqueVisitors.toLocaleString()}
            trend={kpis.uniqueVisitorsTrend}
            icon={<Users className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Avg. Session"
            value={formatDuration(kpis.avgSessionDuration)}
            trend={kpis.sessionDurationTrend}
            icon={<Clock className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Bounce Rate"
            value={`${kpis.bounceRate}%`}
            trend={kpis.bounceRateTrend}
            icon={<TrendingDown className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="CTR"
            value={`${kpis.clickThroughRate}%`}
            icon={<MousePointer className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <AnalyticsKPICard
            title="Avg. Scroll Depth"
            value={`${kpis.avgScrollDepth}%`}
            icon={<ArrowDown className="h-5 w-5" />}
            isLoading={isLoading}
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visits Over Time */}
          <AnalyticsMultiLineChart
            title="Traffic Over Time"
            data={timeSeriesData}
            lines={[
              { dataKey: 'visits', color: '#3b82f6', name: 'Page Views' },
              { dataKey: 'uniqueVisitors', color: '#10b981', name: 'Unique Visitors' }
            ]}
            isLoading={isLoading}
            className="col-span-1 lg:col-span-2"
          />

          {/* Session Duration Chart */}
          <AnalyticsLineChart
            title="Session Duration Trend"
            data={timeSeriesData}
            dataKey="avgSessionDuration"
            strokeColor="#8b5cf6"
            showArea
            isLoading={isLoading}
          />

          {/* Device Usage */}
          <AnalyticsPieChart
            title="Device Distribution"
            data={deviceData}
            dataKey="value"
            nameKey="name"
            isLoading={isLoading}
          />

          {/* Browser Usage */}
          <AnalyticsPieChart
            title="Browser Distribution"
            data={browserData}
            dataKey="value"
            nameKey="name"
            isLoading={isLoading}
          />

          {/* Top Landing Pages */}
          <AnalyticsBarChart
            title="Top Landing Pages"
            data={topLandingPages}
            dataKey="visits"
            nameKey="page"
            fillColor="#3b82f6"
            layout="vertical"
            isLoading={isLoading}
          />

          {/* Top Exit Pages */}
          <AnalyticsBarChart
            title="Top Exit Pages"
            data={topExitPages}
            dataKey="visits"
            nameKey="page"
            fillColor="#ef4444"
            layout="vertical"
            isLoading={isLoading}
          />
        </div>

        {/* Activity Feed and Events Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnalyticsEventsTable 
              events={recentEvents} 
              isLoading={isLoading} 
            />
          </div>
          
          <div className="lg:col-span-1">
            <RealTimeActivityFeed 
              initialEvents={recentEvents.slice(0, 20)} 
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
