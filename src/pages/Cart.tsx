import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, PartyPopper } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const Cart = () => {
  const { items, isLoading, removeFromCart, updateQuantity, getSubTotal, getTax, getCartTotal } = useCart();

  // Celebration animation on mount
  useEffect(() => {
    // Create confetti effect
    const createConfetti = () => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'fixed w-2 h-2 pointer-events-none z-50';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 5000);
      }
    };

    // Add CSS animation for falling confetti
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    createConfetti();
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link to="/">
              <Button className="btn-primary">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Celebration Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 space-y-2 sm:space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <PartyPopper className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground">Congratulations!</h1>
            <PartyPopper className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
          </div>
          <p className="text-sm sm:text-base md:text-xl text-primary font-semibold">
            Thank you for being an Ordify customer! 🎉
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Your Cart ({items.length} items)</h2>
            
            <div className="space-y-3 sm:space-y-4">
              {items.map((item) => (
                <div key={item.id} className="product-card p-3 sm:p-4 md:p-6">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product?.images[0] || "/api/placeholder/120/120"}
                        alt={item.product?.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow space-y-1 sm:space-y-2 min-w-0">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">{item.product?.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.product?.brand}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-muted-foreground">Size: <span className="text-foreground font-medium">{item.size}</span></span>
                        <span className="text-muted-foreground">Color: <span className="text-foreground font-medium capitalize">{item.color}</span></span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 min-h-[32px]"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="font-medium text-foreground min-w-[1.5rem] text-center text-sm">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 min-h-[32px]"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <span className="font-bold text-sm sm:text-lg text-foreground">
                            ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="product-card p-4 sm:p-6 space-y-4 sm:space-y-6 sticky top-20">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Order Summary</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{getSubTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Tax</span>
                  <span>₹{getTax().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-base sm:text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Link to="/checkout" className="block">
                  <Button className="w-full btn-primary text-sm sm:text-lg py-4 sm:py-6 min-h-[48px]">
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full min-h-[44px]">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Free Shipping Notice */}
              <div className="bg-card border border-primary/20 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-center">
                  <span className="text-primary font-semibold">🚚 Free Shipping</span> on all orders!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;