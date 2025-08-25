import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, Truck, Calendar, PartyPopper } from 'lucide-react';
import Layout from '@/components/layout/Layout';

interface OrderItem {
  product_name: string;
  brand: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get data from navigation state if available
  const orderFromState = location.state?.orderData;
  const orderNumberFromState = location.state?.orderNumber;

  useEffect(() => {
    // Confetti animation
    const createConfetti = () => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'fixed w-3 h-3 pointer-events-none z-50';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.animation = `confettiFall ${Math.random() * 4 + 3}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 7000);
      }
    };

    // Add CSS animation for confetti
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(120vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    createConfetti();

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder({
          ...data,
          items: (data.items as unknown) as OrderItem[]
        } as Order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderFromState && orderNumberFromState) {
      // Use data from state if available (immediate after order)
      setOrder({
        id: orderId || '',
        order_number: orderNumberFromState,
        ...orderFromState
      } as Order);
      setIsLoading(false);
    } else {
      // Fetch from database
      fetchOrder();
    }
  }, [orderId, orderFromState, orderNumberFromState]);

  const getEstimatedDelivery = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse max-w-2xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Order not found</h1>
            <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
            <Link to="/">
              <Button className="btn-primary">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12 space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="h-24 w-24 text-success" />
                <PartyPopper className="absolute -top-2 -right-2 h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Order Confirmed! 🎉</h1>
              <p className="text-xl text-success font-semibold">
                Thank you for your purchase, {order.customer_name}!
              </p>
              <p className="text-muted-foreground">
                Your order has been received and is being processed.
              </p>
            </div>

            {/* Order Number */}
            <div className="bg-card border border-primary/20 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="text-2xl font-bold text-primary">{order.order_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              {/* Items */}
              <div className="product-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <img
                        src={item.image || "/api/placeholder/80/80"}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-grow">
                        <h4 className="font-semibold text-foreground">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                        </p>
                        <p className="font-medium text-foreground">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="product-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Shipping Address</h2>
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">{order.customer_name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}</p>
                  <p className="mt-2">Phone: {order.customer_phone}</p>
                  <p>Email: {order.customer_email}</p>
                </div>
              </div>
            </div>

            {/* Order Summary & Status */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="product-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>₹{order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      Payment Method: {order.payment_method.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="product-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Delivery Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Processing</p>
                      <p className="text-sm text-muted-foreground">Your order is being prepared</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">Shipping</p>
                      <p className="text-sm text-muted-foreground">Will be dispatched soon</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Estimated Delivery</p>
                      <p className="text-sm text-primary font-semibold">{getEstimatedDelivery()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link to="/track-order" className="block">
                  <Button variant="outline" className="w-full">
                    Track Your Order
                  </Button>
                </Link>
                
                <Link to="/" className="block">
                  <Button className="w-full btn-primary">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;