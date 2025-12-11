import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  images: string[];
  brand: string;
  featured?: boolean;
  thumbnail_image?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const trackProductClick = async (productId: string, productName: string, clickType: 'thumbnail' | 'add_to_cart') => {
  try {
    const sessionId = getSessionId();
    await supabase.from('analytics_events').insert({
      session_id: sessionId,
      event_type: 'click',
      page_url: window.location.pathname,
      page_title: document.title,
      click_target: clickType === 'thumbnail' ? 'product_thumbnail' : 'add_to_cart_button',
      product_id: productId,
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
               navigator.userAgent.includes('Safari') ? 'Safari' : 
               navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
      metadata: { product_name: productName }
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleThumbnailClick = () => {
    trackProductClick(product.id, product.name, 'thumbnail');
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackProductClick(product.id, product.name, 'add_to_cart');
    onAddToCart?.(product.id);
  };

  return (
    <div className="product-card group">
      <Link 
        to={`/product/${product.slug}`} 
        className="block"
        onClick={handleThumbnailClick}
      >
        <div className="relative overflow-hidden rounded-t-lg aspect-square">
          <img
            src={
              product.thumbnail_image || 
              (product.images && product.images.length > 0 ? product.images[0] : null) ||
              "/api/placeholder/400/400"
            }
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {discount > 0 && (
            <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2">
              -{discount}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2">
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{product.brand}</p>
          <Link to={`/product/${product.slug}`} onClick={handleThumbnailClick}>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-xs sm:text-sm md:text-base leading-tight">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap min-w-0">
            <span className="price-pill text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">₹{product.price}</span>
            {product.original_price && (
              <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                ₹{product.original_price}
              </span>
            )}
          </div>
          
          <Button
            size="icon"
            className="rounded-full bg-primary hover:bg-primary-hover h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
            onClick={handleAddToCartClick}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;