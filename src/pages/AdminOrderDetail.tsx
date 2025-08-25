import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Edit, Save, X, FileText, Download, Upload, Package, MapPin, CreditCard, Truck } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { OrderItemsSection } from '@/components/admin/OrderItemsSection';
import { ShippingManagement } from '@/components/admin/ShippingManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { PaymentHistory } from '@/components/admin/PaymentHistory';

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  instagram_username?: string;
  status: string;
  payment_method: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  invoice_url?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  items: any;
}

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<OrderDetail>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  useEffect(() => {
    // Set up realtime subscription for order updates
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`
        },
        () => {
          fetchOrderDetail();
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
      setEditData(data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrder = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(editData)
        .eq('id', id);

      if (error) throw error;

      await logActivity('order', id!, 'update', `Order details updated`, order, editData);
      
      toast({
        title: "Order Updated",
        description: "Order details have been saved successfully",
      });
      
      setOrder({ ...order!, ...editData });
      setIsEditing(false);
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await logActivity('order', id!, 'status_change', `Order status changed from ${order?.status} to ${newStatus}`);
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
      
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

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

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Order Not Found</h1>
            <Button onClick={() => navigate('/admin/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" onClick={() => navigate('/admin/orders')} className="self-start">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Orders</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Order {order.order_number}</h1>
              <p className="text-muted-foreground text-sm">
                Created {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button onClick={updateOrder} size="sm">
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Order</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {getStatusBadge(order.status)}
              </div>
              
              <div>
                <label className="text-sm font-medium">Update Status</label>
                <Select value={order.status} onValueChange={updateStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="refund_initiated">Refund Initiated</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full mb-2" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{Number(order.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{Number(order.shipping_cost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{Number(order.discount || 0).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Payment Method:</span>
                <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Customer & Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    value={editData.customer_name || ''}
                    onChange={(e) => setEditData({...editData, customer_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={editData.customer_email || ''}
                    onChange={(e) => setEditData({...editData, customer_email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={editData.customer_phone || ''}
                    onChange={(e) => setEditData({...editData, customer_phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Instagram</label>
                  <Input
                    value={editData.instagram_username || ''}
                    onChange={(e) => setEditData({...editData, instagram_username: e.target.value})}
                    className="mt-1"
                    placeholder="@username"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Address Line 1</label>
                  <Input
                    value={editData.address_line1 || ''}
                    onChange={(e) => setEditData({...editData, address_line1: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={editData.city || ''}
                    onChange={(e) => setEditData({...editData, city: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={editData.state || ''}
                    onChange={(e) => setEditData({...editData, state: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pincode</label>
                  <Input
                    value={editData.pincode || ''}
                    onChange={(e) => setEditData({...editData, pincode: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={editData.country || ''}
                    onChange={(e) => setEditData({...editData, country: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Customer Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {order.customer_name}</p>
                    <p><strong>Email:</strong> {order.customer_email}</p>
                    <p><strong>Phone:</strong> {order.customer_phone}</p>
                    {order.instagram_username && (
                      <p><strong>Instagram:</strong> @{order.instagram_username}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <div className="text-sm">
                    <p>{order.address_line1}</p>
                    {order.address_line2 && <p>{order.address_line2}</p>}
                    <p>{order.city}, {order.state} {order.pincode}</p>
                    <p>{order.country}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <OrderItemsSection orderId={order.id} items={order.items || []} />

        {/* Shipping Management */}
        <ShippingManagement 
          order={order} 
          onStatusUpdate={() => {
            fetchOrderDetail();
            setRefreshTrigger(prev => prev + 1);
          }} 
        />

        {/* Payment Management & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentManagement 
                orderId={order.id} 
                onPaymentAdded={() => setRefreshTrigger(prev => prev + 1)} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="font-medium">₹{Number(order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Payment Status:</span>
                <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <PaymentHistory 
          orderId={order.id} 
          refreshTrigger={refreshTrigger}
          orderTotal={Number(order.total)}
        />

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                placeholder="Add internal notes about this order..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.notes || 'No notes added yet'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;