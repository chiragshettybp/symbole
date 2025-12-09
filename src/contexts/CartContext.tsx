import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  session_id: string;
  quantity: number;
  size: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Extended fields for display
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    brand: string;
    slug: string;
  };
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, size: string, color?: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getSubTotal: () => number;
  getTax: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Generate or retrieve session ID for guest users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const sessionId = getSessionId();

  // Fetch cart items on mount
  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            images,
            brand,
            slug
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      const itemsWithProduct = cartItems?.map(item => ({
        ...item,
        product: item.products as any
      })) || [];

      setItems(itemsWithProduct);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, size: string, color: string = 'black', quantity: number = 1) => {
    try {
      // Check if item already exists in cart
      const existingItem = items.find(item => 
        item.product_id === productId && item.size === size && item.color === color
      );

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            product_id: productId,
            session_id: sessionId,
            quantity,
            size,
            color
          });

        if (error) throw error;
        
        await fetchCartItems();
        toast({
          title: "Added to cart!",
          description: "Product has been added to your cart.",
        });
      }
      // Auto-open cart sidebar after adding
      setIsCartOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      await fetchCartItems();
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getSubTotal = (): number => {
    return items.reduce((total, item) => {
      return total + ((item.product?.price || 0) * item.quantity);
    }, 0);
  };

  const getTax = (): number => {
    return getSubTotal() * 0.08; // 8% tax
  };

  const getCartTotal = (): number => {
    return getSubTotal() + getTax();
  };

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  const value: CartContextType = {
    items,
    isLoading,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getSubTotal,
    getTax,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};