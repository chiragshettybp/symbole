import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, Truck, Clock, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
  items: any[];
  shipping_address: any;
}

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both order number and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.trim())
        .eq('customer_email', email.trim().toLowerCase())
        .single();

      if (error || !data) {
        setNotFound(true);
        toast({
          title: "Order Not Found",
          description: "No order found with the provided details. Please check your order number and email.",
          variant: "destructive"
        });
      } else {
        setOrder(data as Order);
      }
    } catch (error) {
      console.error('Error searching order:', error);
      setNotFound(true);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/20',
          label: 'Order Received',
          description: 'Your order has been received and is being processed.'
        };
      case 'processing':
        return {
          icon: Package,
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          label: 'Processing',
          description: 'Your order is being prepared for shipment.'
        };
      case 'shipped':
        return {
          icon: Truck,
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          label: 'Shipped',
          description: 'Your order is on its way to you.'
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/20',
          label: 'Delivered',
          description: 'Your order has been delivered successfully.'
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
          border: 'border-muted/20',
          label: 'Unknown',
          description: 'Status information unavailable.'
        };
    }
  };

  const getProgressSteps = (currentStatus: string) => {
    const steps = [
      { key: 'pending', label: 'Order Received' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStatus.toLowerCase());
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-4">Track Your Order</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Enter your order number and email to track your shipment
            </p>
          </div>

          {/* Search Form */}
          <div className="product-card p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <Label htmlFor="orderNumber" className="text-xs sm:text-sm">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="ORD-1234567890"
                    required
                    className="bg-card border-border h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="bg-card border-border h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Order Not Found */}
          {notFound && !order && (
            <div className="product-card p-8 text-center">
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Order Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find an order with the provided details. Please check your order number and email address.
                </p>
              </div>
            </div>
          )}

          {/* Order Results */}
          {order && (
            <div className="space-y-8">
              {/* Order Header */}
              <div className="product-card p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{order.order_number}</h2>
                    <p className="text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    {(() => {
                      const statusInfo = getStatusInfo(order.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div className={`inline-flex items-center px-4 py-2 rounded-full ${statusInfo.bg} ${statusInfo.border} border`}>
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.color}`} />
                          <span className={`font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Progress Timeline - Desktop */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between">
                    {getProgressSteps(order.status).map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          step.completed 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-border bg-background text-muted-foreground'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-center">
                          <p className={`text-sm font-medium ${
                            step.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </p>
                        </div>

                        {index < 3 && (
                          <div className={`hidden md:block absolute w-full h-0.5 mt-4 ${
                            step.completed ? 'bg-primary' : 'bg-border'
                          }`} 
                          style={{ 
                            left: '50%', 
                            width: 'calc(100% - 2rem)',
                            zIndex: -1 
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Timeline - Mobile */}
                <div className="md:hidden space-y-4">
                  {getProgressSteps(order.status).map((step) => (
                    <div key={step.key} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        step.completed 
                          ? 'bg-primary border-primary' 
                          : 'border-border bg-background'
                      }`}>
                        {step.completed && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        step.completed ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Items */}
                <div className="product-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4">
                        <img
                          src={item.image || "/api/placeholder/60/60"}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {item.product_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.brand} • Size: {item.size} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-foreground">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="product-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Shipping Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping to:</p>
                      <div className="mt-1">
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const statusInfo = getStatusInfo(order.status);
                      return (
                        <div className={`p-4 rounded-lg ${statusInfo.bg} ${statusInfo.border} border`}>
                          <div className="flex items-start space-x-3">
                            <statusInfo.icon className={`h-5 w-5 mt-0.5 ${statusInfo.color}`} />
                            <div>
                              <p className={`font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {statusInfo.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrder;