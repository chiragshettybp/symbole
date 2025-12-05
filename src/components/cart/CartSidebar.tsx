import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CartSidebarProps {
  children: React.ReactNode;
}

const CartSidebar = ({ children }: CartSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, isLoading, removeFromCart, updateQuantity, getSubTotal, cartCount } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg sm:text-xl font-bold text-foreground">
              Shopping Cart ({cartCount})
            </SheetTitle>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3 sm:space-x-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground" />
              <div className="space-y-1 sm:space-y-2">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Your cart is empty</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Add some products to get started!
                </p>
              </div>
              <Button 
                onClick={() => setIsOpen(false)} 
                className="btn-primary"
              >
                Start Shopping
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex space-x-3 sm:space-x-4 p-3 sm:p-4 bg-card rounded-lg border border-border">
                    <img
                      src={item.product?.images[0] || "/api/placeholder/80/80"}
                      alt={item.product?.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-xs sm:text-sm truncate">
                        {item.product?.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.product?.brand}
                      </p>
                      <div className="flex items-center mt-0.5 sm:mt-1 space-x-1 sm:space-x-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span>Size: {item.size}</span>
                        <span>•</span>
                        <span className="capitalize">{item.color}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price & Remove */}
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <span className="font-semibold text-xs sm:text-sm text-foreground">
                            ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="border-t border-border p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground text-sm sm:text-base">Subtotal</span>
                  <span className="font-bold text-base sm:text-lg text-foreground">
                    ₹{getSubTotal().toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Taxes and shipping calculated at checkout
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Link to="/cart" className="block" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full min-h-[44px]">
                    View Cart
                  </Button>
                </Link>
                
                <Link to="/checkout" className="block" onClick={() => setIsOpen(false)}>
                  <Button className="w-full btn-primary min-h-[44px]">
                    Checkout
                  </Button>
                </Link>
              </div>

              {/* Free Shipping Notice */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3">
                <p className="text-[10px] sm:text-xs text-center text-primary font-medium">
                  🚚 Free shipping on all orders!
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;