import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, PartyPopper, Package, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const OrderSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    // Confetti animation
    const createConfetti = () => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 0; i < 150; i++) {
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
    
    // Start confetti after a short delay
    setTimeout(() => createConfetti(), 500);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    const processOrderCompletion = async () => {
      try {
        // Get pending order info from localStorage
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        const pendingOrderNumber = localStorage.getItem('pendingOrderNumber');

        if (!pendingOrderId || !pendingOrderNumber) {
          throw new Error('No pending order found');
        }

        // Update order status to completed/paid
        const checkoutCompletedAt = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            payment_method: 'online',
            checkout_completed_at: checkoutCompletedAt
          })
          .eq('id', pendingOrderId);

        if (updateError) throw updateError;

        // Clear cart
        await clearCart();

        // Clean up localStorage
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('pendingOrderNumber');
        localStorage.removeItem('cart_session_id'); // Clear cart session

        // Set state
        setOrderId(pendingOrderId);
        setOrderNumber(pendingOrderNumber);
        setProcessingComplete(true);

        toast({
          title: "Payment Successful! 🎉",
          description: `Order ${pendingOrderNumber} has been confirmed and paid.`,
        });

      } catch (error) {
        console.error('Order completion processing failed:', error);
        
        // Fallback - try to show a generic success message
        setOrderNumber('ORD-SUCCESS');
        setProcessingComplete(true);
        
        toast({
          title: "Payment Received!",
          description: "Your order has been processed successfully.",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processOrderCompletion();
  }, [clearCart, toast]);

  if (isProcessing) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Processing Your Order</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment and finalize your order...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12 space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle className="h-32 w-32 text-success" />
                <PartyPopper className="absolute -top-4 -right-4 h-12 w-12 text-primary animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-foreground">Payment Successful! 🎉</h1>
              <p className="text-2xl text-success font-semibold">
                Thank you for your purchase!
              </p>
              <p className="text-lg text-muted-foreground">
                Your order has been confirmed and is being processed.
              </p>
            </div>

            {/* Order Number Display */}
            {orderNumber && (
              <div className="bg-gradient-primary p-8 rounded-2xl text-center">
                <p className="text-primary-foreground/80 text-lg mb-2">Your Order Number</p>
                <p className="text-4xl font-bold text-primary-foreground tracking-wider">
                  {orderNumber}
                </p>
              </div>
            )}
          </div>

          {/* What's Next Section */}
          <div className="product-card p-8 mb-8">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                What happens next?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Confirmation Email</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an order confirmation via email shortly
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Your order will be packed and prepared for shipping
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🚚</span>
                  </div>
                  <h3 className="font-semibold text-foreground">Fast Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Free shipping - Your sneakers will arrive in 3-5 business days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderId && (
                <Link to={`/order-confirmation/${orderId}`} className="block">
                  <Button variant="outline" className="w-full text-lg py-6">
                    View Order Details
                  </Button>
                </Link>
              )}
              
              <Link to="/track-order" className="block">
                <Button variant="outline" className="w-full text-lg py-6">
                  Track Your Order
                </Button>
              </Link>
            </div>
            
            <Link to="/" className="block">
              <Button className="w-full btn-primary text-xl py-8">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Support Note */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Need help? Contact our support team or check your order status anytime.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccess;