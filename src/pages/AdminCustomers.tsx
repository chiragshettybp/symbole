import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Eye, Download, RefreshCw, Mail, Phone, Instagram, ShoppingBag } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  instagram_username?: string;
  order_count: number;
  total_spent: number;
  last_order_date?: string;
  first_order_date: string;
}

interface CustomerDetail {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  instagram_username?: string;
  orders: {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    payment_method: string;
  }[];
  total_orders: number;
  total_spent: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    
    const channel = supabase
      .channel('orders-changes-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // Aggregate customer data from orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_name, customer_email, customer_phone, instagram_username, total, created_at, id')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch payments to calculate actual revenue
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('order_id, amount')
        .eq('status', 'captured')
        .not('slip_url', 'is', null);

      if (paymentsError) throw paymentsError;

      // Create a map of order_id to payment amount
      const paymentMap = new Map<string, number>();
      payments?.forEach(payment => {
        paymentMap.set(payment.order_id, Number(payment.amount));
      });

      // Group by customer and calculate stats
      const customerMap = new Map<string, Customer>();
      
      orders?.forEach(order => {
        const key = order.customer_email || order.customer_phone;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            instagram_username: order.instagram_username,
            order_count: 0,
            total_spent: 0,
            first_order_date: order.created_at,
            last_order_date: order.created_at
          });
        }
        
        const customer = customerMap.get(key)!;
        customer.order_count += 1;
        
        // Only add to total_spent if there's a captured payment with slip
        const paidAmount = paymentMap.get(order.id) || 0;
        customer.total_spent += paidAmount;
        
        if (new Date(order.created_at) > new Date(customer.last_order_date || '')) {
          customer.last_order_date = order.created_at;
        }
        if (new Date(order.created_at) < new Date(customer.first_order_date)) {
          customer.first_order_date = order.created_at;
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_phone.includes(searchTerm) ||
        customer.instagram_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by total spent descending
    filtered.sort((a, b) => b.total_spent - a.total_spent);

    setFilteredCustomers(filtered);
  };

  const fetchCustomerDetail = async (customer: Customer) => {
    try {
      setLoadingDetail(true);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, payment_method')
        .or(`customer_email.eq.${customer.customer_email},customer_phone.eq.${customer.customer_phone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSelectedCustomer({
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
        instagram_username: customer.instagram_username,
        orders: orders || [],
        total_orders: customer.order_count,
        total_spent: customer.total_spent
      });

      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const exportToCSV = () => {
    const csvData = filteredCustomers.map(customer => ({
      name: customer.customer_name,
      email: customer.customer_email,
      phone: customer.customer_phone,
      instagram: customer.instagram_username || '',
      total_orders: customer.order_count,
      total_spent: customer.total_spent,
      first_order: new Date(customer.first_order_date).toLocaleDateString(),
      last_order: customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : '',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    logActivity('export', null, 'customers_csv_export', `Exported ${csvData.length} customers to CSV`);
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 50000) return { label: 'VIP', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' };
    if (totalSpent >= 25000) return { label: 'Gold', variant: 'default' as const, className: 'bg-orange-100 text-orange-800' };
    if (totalSpent >= 10000) return { label: 'Silver', variant: 'secondary' as const };
    return { label: 'Bronze', variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Customer Management</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={fetchCustomers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or Instagram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{filteredCustomers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">VIP Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredCustomers.filter(c => c.total_spent >= 50000).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{filteredCustomers.length ? Math.round(filteredCustomers.reduce((sum, c) => sum + c.total_spent, 0) / filteredCustomers.reduce((sum, c) => sum + c.order_count, 0)) : 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ₹{filteredCustomers.reduce((sum, customer) => sum + customer.total_spent, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => {
                    const tier = getCustomerTier(customer.total_spent);
                    return (
                      <TableRow key={`${customer.customer_email}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{customer.customer_name}</div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.customer_email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.customer_phone}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {customer.instagram_username ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Instagram className="h-3 w-3" />
                              @{customer.instagram_username}
                            </div>
                          ) : '-'}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{customer.order_count}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="font-medium">
                          ₹{customer.total_spent.toFixed(2)}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={tier.variant} className={tier.className}>
                            {tier.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-sm">
                          {customer.last_order_date ? 
                            new Date(customer.last_order_date).toLocaleDateString() : '-'
                          }
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchCustomerDetail(customer)}
                            disabled={loadingDetail}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredCustomers.map((customer, index) => {
                const tier = getCustomerTier(customer.total_spent);
                return (
                  <div key={`${customer.customer_email}-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{customer.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.customer_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.customer_phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₹{customer.total_spent.toFixed(2)}</div>
                        <Badge variant={tier.variant} className={`${tier.className} text-xs`}>
                          {tier.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{customer.order_count} orders</span>
                      </div>
                      {customer.instagram_username && (
                        <div className="flex items-center gap-1 text-sm">
                          <Instagram className="h-3 w-3" />
                          @{customer.instagram_username}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <div>
                        Last order: {customer.last_order_date ? 
                          new Date(customer.last_order_date).toLocaleDateString() : 'Never'
                        }
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchCustomerDetail(customer)}
                        disabled={loadingDetail}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{selectedCustomer.customer_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        {selectedCustomer.customer_email}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        {selectedCustomer.customer_phone}
                      </div>
                      {selectedCustomer.instagram_username && (
                        <div className="flex items-center gap-2 text-sm">
                          <Instagram className="h-4 w-4" />
                          @{selectedCustomer.instagram_username}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Orders:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.total_orders}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Spent:</span>
                        <span className="ml-2 font-medium">₹{selectedCustomer.total_spent.toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Average Order:</span>
                        <span className="ml-2 font-medium">
                          ₹{selectedCustomer.total_orders ? (selectedCustomer.total_spent / selectedCustomer.total_orders).toFixed(2) : 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>₹{Number(order.total).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {order.payment_method.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;