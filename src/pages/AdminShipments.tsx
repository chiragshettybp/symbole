import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Search, Filter, Plus, Edit, RefreshCw, Package, MapPin, Calendar } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

interface Shipment {
  id: string;
  order_id: string;
  carrier_name: string;
  tracking_number?: string;
  status: string;
  ship_date?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  label_url?: string;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    customer_name: string;
    shipping_address: any;
  };
}

const AdminShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [updateData, setUpdateData] = useState({
    tracking_number: '',
    status: '',
    estimated_delivery: '',
    actual_delivery: ''
  });
  
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchShipments();
    
    const channel = supabase
      .channel('shipments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchShipments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterShipments();
  }, [shipments, searchTerm, statusFilter, carrierFilter]);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders (
            order_number,
            customer_name,
            shipping_address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterShipments = () => {
    let filtered = [...shipments];

    if (searchTerm) {
      filtered = filtered.filter(shipment => 
        shipment.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orders?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.carrier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }

    if (carrierFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.carrier_name === carrierFilter);
    }

    setFilteredShipments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", className?: string } } = {
      'created': { variant: 'secondary' },
      'dispatching_soon': { variant: 'outline', className: 'bg-orange-100 text-orange-800' },
      'picked_up': { variant: 'outline', className: 'bg-blue-100 text-blue-800' },
      'dispatched': { variant: 'default', className: 'bg-blue-600 text-white' },
      'in_transit': { variant: 'default', className: 'bg-indigo-600 text-white' },
      'delivered': { variant: 'default', className: 'bg-green-600 text-white' },
      'return_request': { variant: 'destructive' },
      'return_pickup_ready': { variant: 'outline', className: 'bg-yellow-100 text-yellow-800' },
      'return_picked_up': { variant: 'outline', className: 'bg-yellow-600 text-white' },
      'in_transit_to_warehouse': { variant: 'outline', className: 'bg-purple-100 text-purple-800' },
      'reached_warehouse': { variant: 'default', className: 'bg-gray-600 text-white' },
    };
    
    const config = statusConfig[status] || { variant: 'outline' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const updateShipmentStatus = async (shipmentId: string, newStatus: string, trackingNumber?: string) => {
    try {
      const updates: any = { status: newStatus };
      if (trackingNumber) updates.tracking_number = trackingNumber;
      if (newStatus === 'delivered') updates.actual_delivery = new Date().toISOString();
      
      const { error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', shipmentId);

      if (error) throw error;

      // Also update the order status if delivered
      if (newStatus === 'delivered') {
        const shipment = shipments.find(s => s.id === shipmentId);
        if (shipment) {
          await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', shipment.order_id);
        }
      }

      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });

      logActivity('update', shipmentId, 'shipment', `Updated shipment status to ${newStatus}`);
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive",
      });
    }
  };

  const handleUpdateShipment = async () => {
    if (!selectedShipment) return;

    try {
      const updates: any = {};
      if (updateData.tracking_number) updates.tracking_number = updateData.tracking_number;
      if (updateData.status) updates.status = updateData.status;
      if (updateData.estimated_delivery) updates.estimated_delivery = updateData.estimated_delivery;
      if (updateData.actual_delivery) updates.actual_delivery = updateData.actual_delivery;

      const { error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', selectedShipment.id);

      if (error) throw error;

      setShowUpdateDialog(false);
      setSelectedShipment(null);
      setUpdateData({ tracking_number: '', status: '', estimated_delivery: '', actual_delivery: '' });

      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });

      logActivity('update', selectedShipment.id, 'shipment', `Updated shipment details`);
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to update shipment",
        variant: "destructive",
      });
    }
  };

  const openUpdateDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setUpdateData({
      tracking_number: shipment.tracking_number || '',
      status: shipment.status,
      estimated_delivery: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toISOString().split('T')[0] : '',
      actual_delivery: shipment.actual_delivery ? new Date(shipment.actual_delivery).toISOString().split('T')[0] : ''
    });
    setShowUpdateDialog(true);
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Shipment Management</h1>
          <div className="flex gap-2">
            <Button onClick={fetchShipments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
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
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="dispatching_soon">Dispatching Soon</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="return_request">Return Request</SelectItem>
                    <SelectItem value="return_pickup_ready">Return Pickup Ready</SelectItem>
                    <SelectItem value="return_picked_up">Return Picked Up</SelectItem>
                    <SelectItem value="in_transit_to_warehouse">In Transit to Warehouse</SelectItem>
                    <SelectItem value="reached_warehouse">Reached Warehouse</SelectItem>
                  </SelectContent>
              </Select>

              <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="India Post">India Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{filteredShipments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredShipments.filter(s => s.status === 'in_transit').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {filteredShipments.filter(s => s.status === 'delivered').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {filteredShipments.filter(s => s.status === 'created').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {filteredShipments.filter(s => ['cancelled', 'returned'].includes(s.status)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipments ({filteredShipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ship Date</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.orders?.order_number}
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{shipment.orders?.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {shipment.orders?.shipping_address?.city}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {shipment.carrier_name}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="font-mono text-sm">
                        {shipment.tracking_number || '-'}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(shipment.status)}
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {shipment.ship_date ? 
                          new Date(shipment.ship_date).toLocaleDateString() : '-'
                        }
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {shipment.estimated_delivery ? 
                          new Date(shipment.estimated_delivery).toLocaleDateString() : '-'
                        }
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUpdateDialog(shipment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {shipment.status === 'created' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateShipmentStatus(shipment.id, 'in_transit')}
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          {shipment.status === 'in_transit' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateShipmentStatus(shipment.id, 'delivered')}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredShipments.map((shipment) => (
                <div key={shipment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        {shipment.orders?.order_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {shipment.orders?.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {shipment.orders?.shipping_address?.city}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(shipment.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {shipment.carrier_name}
                    </Badge>
                    {shipment.tracking_number && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {shipment.tracking_number}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {shipment.ship_date && (
                      <div>Ship Date: {new Date(shipment.ship_date).toLocaleDateString()}</div>
                    )}
                    {shipment.estimated_delivery && (
                      <div>Est. Delivery: {new Date(shipment.estimated_delivery).toLocaleDateString()}</div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUpdateDialog(shipment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {shipment.status === 'created' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShipmentStatus(shipment.id, 'in_transit')}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Transit
                        </Button>
                      )}
                      {shipment.status === 'in_transit' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShipmentStatus(shipment.id, 'delivered')}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Deliver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredShipments.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No shipments found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Shipment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Tracking Number"
                value={updateData.tracking_number}
                onChange={(e) => setUpdateData({...updateData, tracking_number: e.target.value})}
              />
              
              <Select 
                value={updateData.status} 
                onValueChange={(value) => setUpdateData({...updateData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                placeholder="Estimated Delivery"
                value={updateData.estimated_delivery}
                onChange={(e) => setUpdateData({...updateData, estimated_delivery: e.target.value})}
              />
              
              <Input
                type="date"
                placeholder="Actual Delivery"
                value={updateData.actual_delivery}
                onChange={(e) => setUpdateData({...updateData, actual_delivery: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateShipment}>Update Shipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminShipments;