import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Package } from 'lucide-react';

interface StatusHistoryItem {
  id: string;
  status: string;
  updated_by?: string;
  notes?: string;
  created_at: string;
}

interface ShipmentStatusHistoryProps {
  shipmentId: string;
}

export const ShipmentStatusHistory = ({ shipmentId }: ShipmentStatusHistoryProps) => {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatusHistory();
    
    // Set up realtime subscription for status history
    const channel = supabase
      .channel('status-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipment_status_history',
          filter: `shipment_id=eq.${shipmentId}`
        },
        () => fetchStatusHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId]);

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('shipment_status_history')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status History ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No status updates yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  {item.notes && (
                    <span className="text-sm text-muted-foreground">
                      {item.notes}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </div>
                  {item.updated_by && (
                    <div className="text-xs text-muted-foreground">
                      by {item.updated_by}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};