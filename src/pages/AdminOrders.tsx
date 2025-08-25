import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Package, CheckCircle, AlertCircle, Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  instagram_username?: string | null;
  status: string;
  total: number;
  discount?: number;
  payment_method: string;
  created_at: string;
  checkout_initiated_at?: string | null;
  checkout_completed_at?: string | null;
  items: any;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const navigate = useNavigate();
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'captured')
        .not('slip_url', 'is', null);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPayments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_method === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await logActivity('order', orderId, 'status_update', `Order status changed to ${newStatus}`);
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrders);

      if (error) throw error;

      await logActivity('order', null, 'bulk_status_update', `Bulk updated ${selectedOrders.length} orders to ${newStatus}`);
      
      toast({
        title: "Bulk Update Complete",
        description: `Updated ${selectedOrders.length} orders to ${newStatus}`,
      });
      
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      toast({
        title: "Error",
        description: "Failed to bulk update orders",
        variant: "destructive",
      });
    }
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    try {
      // Delete related records first
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('order_id', orderId);

      if (paymentsError) throw paymentsError;

      const { error: shipmentsError } = await supabase
        .from('shipments')
        .delete()
        .eq('order_id', orderId);

      if (shipmentsError) throw shipmentsError;

      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      await logActivity('order', orderId, 'delete', `Order ${orderNumber} permanently deleted`);
      
      toast({
        title: "Order Deleted",
        description: `Order ${orderNumber} has been permanently deleted`,
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteOrders = async () => {
    try {
      // Delete related records first
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .in('order_id', selectedOrders);

      if (paymentsError) throw paymentsError;

      const { error: shipmentsError } = await supabase
        .from('shipments')
        .delete()
        .in('order_id', selectedOrders);

      if (shipmentsError) throw shipmentsError;

      // Delete the orders
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .in('id', selectedOrders);

      if (orderError) throw orderError;

      await logActivity('order', null, 'bulk_delete', `Bulk deleted ${selectedOrders.length} orders`);
      
      toast({
        title: "Orders Deleted",
        description: `${selectedOrders.length} orders have been permanently deleted`,
      });
      
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      toast({
        title: "Error",
        description: "Failed to bulk delete orders",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => ({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      status: order.status,
      total: order.total,
      created_at: new Date(order.created_at).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    logActivity('export', null, 'orders_csv_export', `Exported ${csvData.length} orders to CSV`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checkout_initiated':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Checkout Started
        </Badge>;
      case 'paid':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Paid
        </Badge>;
      case 'processing':
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800">
          <Package className="h-3 w-3" />
          Processing
        </Badge>;
      case 'shipped':
        return <Badge variant="default" className="flex items-center gap-1 bg-purple-100 text-purple-800">
          <Package className="h-3 w-3" />
          Shipped
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateCheckoutDuration = (initiated: string | null | undefined, completed: string | null | undefined) => {
    if (!initiated || !completed) return 'N/A';
    
    const start = new Date(initiated);
    const end = new Date(completed);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    if (durationMinutes > 0) {
      return `${durationMinutes}m ${durationSeconds}s`;
    }
    return `${durationSeconds}s`;
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Order Management</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>

              {selectedOrders.length > 0 && (
                <div className="col-span-full flex flex-col sm:flex-row gap-2">
                  <Select onValueChange={bulkUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Update ${selectedOrders.length} selected`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Mark Processing</SelectItem>
                      <SelectItem value="paid">Mark Paid</SelectItem>
                      <SelectItem value="shipped">Mark Shipped</SelectItem>
                      <SelectItem value="delivered">Mark Delivered</SelectItem>
                      <SelectItem value="cancelled">Mark Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete {selectedOrders.length} Orders
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Orders</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete {selectedOrders.length} selected orders? 
                          This action cannot be undone and will also delete all related payments and shipments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={bulkDeleteOrders}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Orders
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
              <p className="text-xs text-muted-foreground">all order records</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status.toLowerCase() === 'delivered').length}
              </div>
              <p className="text-xs text-muted-foreground">successfully fulfilled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Refunded Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {orders.filter(o => o.status.toLowerCase() === 'refunded').length}
              </div>
              <p className="text-xs text-muted-foreground">refunded orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status.toLowerCase() === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order.id]);
                        } else {
                          setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="font-medium text-sm">{order.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(order.created_at)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-sm">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                      <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                      {order.instagram_username && (
                        <div className="text-xs text-blue-400">@{order.instagram_username}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <Badge variant="outline" className="text-xs">{order.payment_method.toUpperCase()}</Badge>
                    </div>
                    <div className="font-medium text-sm">₹{Number(order.total).toFixed(2)}</div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Order</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete order {order.order_number}? 
                            This action cannot be undone and will also delete all related payments and shipments.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteOrder(order.id, order.order_number)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                          {order.instagram_username && (
                            <div className="text-sm text-blue-400">@{order.instagram_username}</div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-auto">
                            <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        ₹{Number(order.total).toFixed(2)}
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {formatTimestamp(order.created_at)}
                      </TableCell>
                      
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => navigate(`/admin/orders/${order.id}`)}
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button size="sm" variant="outline">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Are you sure you want to permanently delete order {order.order_number}? 
                                   This action cannot be undone and will also delete all related payments and shipments.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => deleteOrder(order.id, order.order_number)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   Delete Order
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;