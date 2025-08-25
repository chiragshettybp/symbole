import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Download, Loader2, Trash2, Package } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { ShipmentStatusHistory } from './ShipmentStatusHistory';
import jsPDF from 'jspdf';

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  status: string;
  items: any;
}

interface ShippingManagementProps {
  order: OrderDetail;
  onStatusUpdate: () => void;
}

export const ShippingManagement = ({ order, onStatusUpdate }: ShippingManagementProps) => {
  const [trackingId, setTrackingId] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [existingShipments, setExistingShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetchShipments();
    
    // Set up realtime subscription for shipments
    const channel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `order_id=eq.${order.id}`
        },
        () => fetchShipments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateShippingLabel = (trackingNumber: string, carrier: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('SHIPPING LABEL', 105, 20, { align: 'center' });
    
    // Order Information
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.order_number}`, 20, 40);
    doc.text(`Tracking ID: ${trackingNumber}`, 20, 50);
    doc.text(`Carrier: ${carrier}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Customer Information
    doc.setFontSize(14);
    doc.text('SHIP TO:', 20, 90);
    doc.setFontSize(12);
    doc.text(order.customer_name, 20, 105);
    doc.text(order.customer_phone, 20, 115);
    doc.text(order.customer_email, 20, 125);
    
    // Address
    doc.text('ADDRESS:', 20, 145);
    if (order.address_line1) doc.text(order.address_line1, 20, 155);
    if (order.address_line2) doc.text(order.address_line2, 20, 165);
    if (order.city && order.state) {
      doc.text(`${order.city}, ${order.state} ${order.pincode}`, 20, 175);
    }
    if (order.country) doc.text(order.country, 20, 185);
    
    // Items List
    doc.text('ITEMS:', 20, 205);
    let yPos = 215;
    
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any, index: number) => {
        doc.text(`${index + 1}. ${item.name} - Size: ${item.size} - Qty: ${item.quantity}`, 25, yPos);
        yPos += 10;
      });
    }
    
    // Barcode area (placeholder)
    doc.rect(20, 250, 170, 20);
    doc.text('TRACKING BARCODE AREA', 105, 263, { align: 'center' });
    
    // Download the PDF
    doc.save(`shipping-label-${order.order_number}.pdf`);
  };

  const createShipment = async () => {
    if (!trackingId.trim() || !carrierName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both tracking ID and carrier name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingShipment(true);
    
    try {
      // Create shipment record
      const { error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          order_id: order.id,
          tracking_number: trackingId,
          carrier_name: carrierName,
          status: 'created',
          ship_date: new Date().toISOString(),
        });

      if (shipmentError) throw shipmentError;

      // Update order status to shipped
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Log activity
      await logActivity(
        'shipment',
        order.id,
        'create',
        `Shipment created with tracking ID: ${trackingId}`,
        null,
        { trackingId, carrierName }
      );

      // Generate and download PDF label
      generateShippingLabel(trackingId, carrierName);

      toast({
        title: "Shipment Created",
        description: "Shipment record created and shipping label downloaded",
      });

      // Reset form
      setTrackingId('');
      setCarrierName('');
      
      // Trigger status update in parent
      onStatusUpdate();

    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShipment(false);
    }
  };

   const updateShipmentStatus = async (shipmentId: string, newStatus: string) => {
     try {
       const { error } = await supabase
         .from('shipments')
         .update({ 
           status: newStatus,
           updated_at: new Date().toISOString()
         })
         .eq('id', shipmentId);

       if (error) throw error;

       await logActivity(
         'update',
         shipmentId,
         'shipment',
         `Updated shipment status to ${newStatus}`
       );

       toast({
         title: "Status Updated",
         description: `Shipment status updated to ${newStatus.replace('_', ' ')}`,
       });

       fetchShipments();
     } catch (error) {
       console.error('Error updating shipment status:', error);
       toast({
         title: "Error",
         description: "Failed to update shipment status",
         variant: "destructive",
       });
     }
   };

   const deleteShipment = async (shipmentId: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (error) throw error;

      // Update order status back to paid (or processing)
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Log activity
      await logActivity(
        'shipment',
        order.id,
        'delete',
        `Shipment deleted: ${trackingNumber}`,
        null,
        { trackingNumber }
      );

      toast({
        title: "Shipment Deleted",
        description: "Shipment record has been deleted successfully",
      });

      // Trigger status update in parent
      onStatusUpdate();
    } catch (error) {
      console.error('Error deleting shipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipment",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Shipments */}
        {existingShipments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Existing Shipments ({existingShipments.length})
            </h4>
            {existingShipments.map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{shipment.carrier_name}</Badge>
                      <Select 
                        value={shipment.status} 
                        onValueChange={(newStatus) => updateShipmentStatus(shipment.id, newStatus)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant="secondary">{shipment.status.replace('_', ' ')}</Badge>
                        </SelectTrigger>
                        <SelectContent>
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
                    </div>
                   <p className="text-sm text-muted-foreground">
                     Tracking: {shipment.tracking_number}
                   </p>
                   <p className="text-xs text-muted-foreground">
                     Created: {new Date(shipment.created_at).toLocaleDateString()}
                   </p>
                   <p className="text-xs text-muted-foreground">
                     Last Updated: {new Date(shipment.updated_at).toLocaleString()}
                   </p>
                 </div>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button size="sm" variant="outline">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Delete Shipment</AlertDialogTitle>
                       <AlertDialogDescription>
                         Are you sure you want to delete this shipment? This will also change the order status back to paid.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                       <AlertDialogAction
                         onClick={() => deleteShipment(shipment.id, shipment.tracking_number)}
                         className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                       >
                         Delete Shipment
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             ))}
             
             {/* Status History for First Shipment */}
             {existingShipments.length > 0 && (
               <div className="mt-4">
                 <ShipmentStatusHistory shipmentId={existingShipments[0].id} />
               </div>
             )}
           </div>
         )}

         {/* Create New Shipment Form */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Create New Shipment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackingId">Tracking ID</Label>
              <Input
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Select value={carrierName} onValueChange={setCarrierName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                  <SelectItem value="DTDC">DTDC</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="India Post">India Post</SelectItem>
                  <SelectItem value="Ekart">Ekart</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={createShipment} 
            disabled={isCreatingShipment || !trackingId.trim() || !carrierName.trim()}
            className="w-full"
          >
            {isCreatingShipment ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Shipment...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Create Shipment & Download Label
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};