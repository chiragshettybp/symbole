import { useState } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  DollarSign, 
  Percent, 
  Eye, 
  TrendingUp,
  Package,
  MousePointer,
  ArrowDown,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsKPICard } from '@/components/analytics/AnalyticsKPICard';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { CheckoutFunnelChart } from '@/components/analytics/CheckoutFunnelChart';
import { AbandonmentReasonsChart } from '@/components/analytics/AbandonmentReasonsChart';
import { SizePatternChart } from '@/components/analytics/SizePatternChart';
import { FitFeedbackChart } from '@/components/analytics/FitFeedbackChart';
import { TrendingProductsTable } from '@/components/analytics/TrendingProductsTable';
import { WishlistAnalyticsTable } from '@/components/analytics/WishlistAnalyticsTable';
import { RecentlyViewedTable } from '@/components/analytics/RecentlyViewedTable';
import { HighIntentPagesTable } from '@/components/analytics/HighIntentPagesTable';
import { useEcommerceAnalytics, DateRange } from '@/hooks/useEcommerceAnalytics';

const AdminEcommerceAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const {
    cartCheckoutKPIs,
    productKPIs,
    funnelData,
    abandonmentReasons,
    abandonedProducts,
    sizePatterns,
    fitFeedback,
    trendingProducts,
    wishlistData,
    recentlyViewedData,
    highIntentPages,
    isLoading,
    refetch
  } = useEcommerceAnalytics(dateRange, customStart, customEnd, {
    deviceType: deviceFilter !== 'all' ? deviceFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined
  });

  const handleDateRangeChange = (range: DateRange, start?: Date, end?: Date) => {
    setDateRange(range);
    if (start) setCustomStart(start);
    if (end) setCustomEnd(end);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">E-commerce Analytics</h1>
              <p className="text-muted-foreground mt-1">Customer behavior, cart analytics, and fashion trends</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
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

          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="jackets">Jackets</SelectItem>
                <SelectItem value="shirts">Shirts</SelectItem>
                <SelectItem value="pants">Pants</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="cart" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="cart" className="text-xs sm:text-sm py-2">
              <ShoppingCart className="h-4 w-4 mr-2 hidden sm:inline" />
              Cart & Checkout
            </TabsTrigger>
            <TabsTrigger value="product" className="text-xs sm:text-sm py-2">
              <Package className="h-4 w-4 mr-2 hidden sm:inline" />
              Product Experience
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm py-2">
              <TrendingUp className="h-4 w-4 mr-2 hidden sm:inline" />
              Fashion Trends
            </TabsTrigger>
            <TabsTrigger value="behavior" className="text-xs sm:text-sm py-2">
              <Eye className="h-4 w-4 mr-2 hidden sm:inline" />
              Customer Behavior
            </TabsTrigger>
          </TabsList>

          {/* Cart & Checkout Tab */}
          <TabsContent value="cart" className="space-y-6">
            {/* Cart KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <AnalyticsKPICard
                title="Cart Abandonment"
                value={`${cartCheckoutKPIs.cartAbandonmentRate}%`}
                icon={<ShoppingCart className="h-5 w-5" />}
                isLoading={isLoading}
                className="bg-red-50 border-red-200"
              />
              <AnalyticsKPICard
                title="Checkout Complete"
                value={`${cartCheckoutKPIs.checkoutCompletionRate}%`}
                icon={<CheckCircle className="h-5 w-5" />}
                isLoading={isLoading}
                className="bg-green-50 border-green-200"
              />
              <AnalyticsKPICard
                title="Avg Cart Value"
                value={`₹${cartCheckoutKPIs.avgCartValue}`}
                icon={<DollarSign className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Total Carts"
                value={cartCheckoutKPIs.totalCarts.toString()}
                icon={<ShoppingCart className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Completed Orders"
                value={cartCheckoutKPIs.completedCheckouts.toString()}
                icon={<CheckCircle className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Coupons Used"
                value={cartCheckoutKPIs.couponsUsedToday.toString()}
                icon={<Percent className="h-5 w-5" />}
                isLoading={isLoading}
              />
            </div>

            {/* Funnel and Abandonment Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CheckoutFunnelChart data={funnelData} isLoading={isLoading} />
              <AbandonmentReasonsChart data={abandonmentReasons} isLoading={isLoading} />
            </div>

            {/* Abandoned Products Table */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Frequently Abandoned Products</h3>
              {abandonedProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No abandoned product data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Product</th>
                        <th className="text-left py-2 px-3">Category</th>
                        <th className="text-center py-2 px-3">Abandoned</th>
                        <th className="text-center py-2 px-3">Added to Cart</th>
                        <th className="text-center py-2 px-3">Drop-off Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abandonedProducts.slice(0, 10).map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{product.name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{product.category}</td>
                          <td className="py-2 px-3 text-center text-red-600">{product.timesAbandoned}</td>
                          <td className="py-2 px-3 text-center">{product.addToCartFrequency}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.dropOffRate > 50 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {product.dropOffRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Product Experience Tab */}
          <TabsContent value="product" className="space-y-6">
            {/* Product KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsKPICard
                title="Add-to-Cart Rate"
                value={`${productKPIs.addToCartRate}%`}
                icon={<MousePointer className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Most Viewed"
                value={productKPIs.mostViewedProduct?.name || 'N/A'}
                valueClassName="text-lg"
                icon={<Eye className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Avg Scroll Depth"
                value={`${productKPIs.avgScrollDepth}%`}
                icon={<ArrowDown className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Product Views"
                value={productKPIs.totalProductViews.toString()}
                icon={<Eye className="h-5 w-5" />}
                isLoading={isLoading}
              />
            </div>

            {/* Size and Fit Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SizePatternChart data={sizePatterns} isLoading={isLoading} />
              <FitFeedbackChart data={fitFeedback} isLoading={isLoading} />
            </div>
          </TabsContent>

          {/* Fashion Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Trend KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsKPICard
                title="Trending Product"
                value={trendingProducts[0]?.name || 'N/A'}
                valueClassName="text-lg"
                icon={<TrendingUp className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Products Tracked"
                value={trendingProducts.length.toString()}
                icon={<Package className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Top Velocity"
                value={trendingProducts[0]?.velocity?.toString() || '0'}
                icon={<TrendingUp className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="High Interest"
                value={recentlyViewedData.filter(r => r.repeatViews > 2).length.toString()}
                icon={<Eye className="h-5 w-5" />}
                isLoading={isLoading}
              />
            </div>

            {/* Trending Products */}
            <TrendingProductsTable data={trendingProducts} isLoading={isLoading} />
          </TabsContent>

          {/* Customer Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            {/* Behavior KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsKPICard
                title="Wishlist Items"
                value={wishlistData.reduce((sum, w) => sum + w.addedCount, 0).toString()}
                icon={<ShoppingCart className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Wishlist Conversion"
                value={`${wishlistData.length > 0 
                  ? Math.round(wishlistData.reduce((sum, w) => sum + w.conversionRate, 0) / wishlistData.length) 
                  : 0}%`}
                icon={<CheckCircle className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="Recently Viewed"
                value={recentlyViewedData.reduce((sum, r) => sum + r.totalViews, 0).toString()}
                icon={<Eye className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <AnalyticsKPICard
                title="High-Intent Pages"
                value={highIntentPages.filter(p => p.addToCartRate >= 10).length.toString()}
                icon={<MousePointer className="h-5 w-5" />}
                isLoading={isLoading}
              />
            </div>

            {/* Behavior Analytics Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WishlistAnalyticsTable data={wishlistData} isLoading={isLoading} />
              <RecentlyViewedTable data={recentlyViewedData} isLoading={isLoading} />
            </div>

            {/* High Intent Pages */}
            <HighIntentPagesTable data={highIntentPages} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEcommerceAnalytics;
