import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Package, DollarSign, Clock, AlertTriangle, TrendingUp, Users, CalendarIcon, Filter, ChevronDown, Truck, XCircle, CheckCircle2, CreditCard, RefreshCw, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLiveAnalytics } from '@/hooks/useLiveAnalytics';
import { useRevenueCards } from '@/hooks/useRevenueCards';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  pendingFulfillments: number;
}

interface DetailedTransaction {
  id: string;
  amount: number;
  type: 'payment' | 'refund';
  date: string;
  order_number?: string;
  customer_name?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock_count: number;
}

const AdminDashboard = () => {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const navigate = useNavigate();

  // Use the live analytics hook for order metrics
  const { liveStats, isLoading: analyticsLoading, refresh } = useLiveAnalytics();
  
  // Use the revenue cards hook for individual revenue metrics
  const { 
    totalRevenue, 
    netRevenue, 
    avgOrderValue, 
    refundedAmount, 
    isLoading: revenueLoading, 
    refresh: refreshRevenue 
  } = useRevenueCards();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up realtime subscription for additional data
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders for recent orders and chart data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            line_total,
            name_snapshot
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch products for low stock
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_count')
        .lt('stock_count', 5)
        .order('stock_count', { ascending: true });

      if (productsError) throw productsError;

      // Filter orders by date range for chart and top products
      const filteredOrders = orders?.filter(order => 
        isWithinInterval(new Date(order.created_at), {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        })
      ) || [];

      const deliveredOrders = filteredOrders.filter(order => 
        ['delivered', 'completed'].includes(order.status.toLowerCase())
      );

      // Generate revenue chart data
      const chartData: RevenueData[] = [];
      const daysCount = Math.min(30, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i < daysCount; i++) {
        const date = subDays(dateRange.to, daysCount - 1 - i);
        const dayOrders = deliveredOrders.filter(order => 
          new Date(order.created_at).toDateString() === date.toDateString()
        );
        
        const dayRevenue = dayOrders.reduce((sum, order) => 
          sum + Number(order.total) - Number(order.discount || 0), 0
        );

        chartData.push({
          date: format(date, 'MMM dd'),
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }
      setRevenueData(chartData);

      // Calculate top products
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      
      deliveredOrders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const productName = item.name_snapshot;
          if (productMap.has(productName)) {
            const existing = productMap.get(productName)!;
            existing.quantity += Number(item.quantity);
            existing.revenue += Number(item.line_total);
          } else {
            productMap.set(productName, {
              quantity: Number(item.quantity),
              revenue: Number(item.line_total)
            });
          }
        });
      });

      const topProductsArray: TopProduct[] = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsArray);

      setRecentOrders((orders?.slice(0, 10) || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total: order.total,
        status: order.status,
        payment_status: order.payment_method,
        created_at: order.created_at,
      })));

      setLowStockProducts(products || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetRevenueColor = (netRevenue: number) => {
    if (netRevenue > 0) return 'text-green-600';
    if (netRevenue < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const MetricDetailDialog = ({ 
    title, 
    value, 
    type, 
    children 
  }: { 
    title: string; 
    value: number; 
    type: 'revenue' | 'captured' | 'refund' | 'net'; 
    children?: React.ReactNode;
  }) => (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title} - Detailed Breakdown</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className={cn(
              "text-3xl font-bold",
              type === 'revenue' && "text-blue-600",
              type === 'captured' && "text-green-600", 
              type === 'refund' && "text-red-600",
              type === 'net' && getNetRevenueColor(value)
            )}>
              ₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {type === 'net' && "Net Revenue = Captured Amount - Refund Amount"}
            </p>
          </div>
          {/* Additional breakdown details can be added here */}
          <div className="text-sm text-muted-foreground text-center">
            Date Range: {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", className?: string } } = {
      'pending': { variant: 'secondary' },
      'processing': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'paid': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'shipped': { variant: 'default', className: 'bg-purple-100 text-purple-800' },
      'delivered': { variant: 'default', className: 'bg-emerald-100 text-emerald-800' },
      'refund_initiated': { variant: 'default', className: 'bg-orange-100 text-orange-800' },
      'refunded': { variant: 'default', className: 'bg-red-100 text-red-800' },
      'cancelled': { variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { variant: 'outline' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading || analyticsLoading || revenueLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={() => { refresh(); refreshRevenue(); }} variant="outline" size="sm" className="w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={fetchDashboardData} variant="outline" size="sm" className="w-fit">
              Update Data
            </Button>
          </div>
        </div>



        {/* Revenue Analytics Cards - Each with individual queries */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue - Blue */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">sum of paid payments</p>
              </CardContent>
            </Card>

            {/* Net Revenue - Green */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Net Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₹{netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">total revenue - refunds</p>
              </CardContent>
            </Card>

            {/* Average Order Value - Purple */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-600">Average Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₹{avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">net revenue ÷ delivered orders</p>
              </CardContent>
            </Card>

            {/* Refunded Amount - Red */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Refunded Amount</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₹{refundedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">sum of refund payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/orders')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{liveStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">all time</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/orders')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Delivered</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{liveStats.deliveredOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {liveStats.totalOrders > 0 ? Math.round((liveStats.deliveredOrders / liveStats.totalOrders) * 100) : 0}% conversion
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/orders')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{liveStats.cancelledOrders}</div>
                <p className="text-xs text-muted-foreground">cancelled orders</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/orders')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{liveStats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">awaiting processing</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-600">Active Users</CardTitle>
                <Users className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{liveStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">last 30 days</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-600">Order Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {liveStats.totalOrders > 0 ? Math.round((liveStats.deliveredOrders / liveStats.totalOrders) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">delivered / total orders</p>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Top Products and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm truncate max-w-[150px]">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.quantity} sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">₹{product.revenue.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-muted-foreground">revenue</div>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No sales data available for selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{order.customer_name}</div>
                    <div className="flex justify-between items-center">
                      {getStatusBadge(order.status)}
                      <div className="font-medium text-sm">₹{Number(order.total).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="font-medium">₹{Number(order.total).toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products */}
        {lowStockProducts.length > 0 && (
          <Card className="bg-black border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400 text-base md:text-lg">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="space-y-2 md:space-y-3">
                {lowStockProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-2 md:p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => navigate('/admin/products')}
                  >
                    <span className="font-medium text-sm md:text-base text-white truncate mr-2">{product.name}</span>
                    <Badge variant="destructive" className="text-xs">
                      {product.stock_count} left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;