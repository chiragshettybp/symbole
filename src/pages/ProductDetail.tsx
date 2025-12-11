import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, X, Check, Shield, BadgeCheck, Lock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { ProductReviews } from "@/components/reviews/ProductReviews";
const ProductDetail = () => {
  const {
    slug
  } = useParams();
  const {
    addToCart
  } = useCart();
  const {
    toast
  } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({
    x: 0,
    y: 0
  });
  const [touchZoomScale, setTouchZoomScale] = useState(1);
  const [touchPanOffset, setTouchPanOffset] = useState({
    x: 0,
    y: 0
  });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [lastTouchCount, setLastTouchCount] = useState(0);
  const {
    data: product,
    isLoading
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('slug', slug).neq('visible', false).single();
      if (error) throw error;
      return data;
    }
  });
  const {
    data: relatedProducts
  } = useQuery({
    queryKey: ['related-products', product?.category],
    queryFn: async () => {
      if (!product) return [];
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('category', product.category).neq('id', product.id).neq('visible', false).limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product
  });
  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive"
      });
      return;
    }
    await addToCart(product.id, selectedSize, selectedColor || product.colors?.[0] || 'black', quantity);
  };
  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1);
    }
  };
  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setZoomPosition({
      x,
      y
    });
  };
  const handleMouseEnter = () => {
    setIsZoomed(true);
  };
  const handleMouseLeave = () => {
    setIsZoomed(false);
  };
  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setInitialPinchDistance(distance);
      setLastTouchCount(2);
    } else if (e.touches.length === 1) {
      setLastTouchCount(1);
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scale = Math.min(Math.max(1, currentDistance / initialPinchDistance * touchZoomScale), 3);
      setTouchZoomScale(scale);
      if (scale > 1) {
        setIsZoomed(true);
      }
    } else if (e.touches.length === 1 && touchZoomScale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width * 100;
      const y = (touch.clientY - rect.top) / rect.height * 100;
      setZoomPosition({
        x,
        y
      });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      setInitialPinchDistance(null);
    }
    if (e.touches.length === 0) {
      // Double tap to reset zoom
      if (lastTouchCount === 1 && touchZoomScale > 1) {
        setTimeout(() => {
          setTouchZoomScale(1);
          setIsZoomed(false);
          setTouchPanOffset({
            x: 0,
            y: 0
          });
        }, 300);
      }
      setLastTouchCount(0);
    }
  };
  if (isLoading) {
    return <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>;
  }
  if (!product) {
    return <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </Layout>;
  }
  const discount = product.original_price ? Math.round((product.original_price - product.price) / product.original_price * 100) : 0;
  return <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Image Gallery */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-square cursor-zoom-in touch-none" onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              <img src={product.images && product.images.length > 0 ? product.images[currentImageIndex] : product.thumbnail_image || "/api/placeholder/600/600"} alt={product.name} className={`w-full h-full object-cover transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`} style={isZoomed ? {
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              transform: `scale(${touchZoomScale > 1 ? touchZoomScale : 1.5})`
            } : touchZoomScale > 1 ? {
              transform: `scale(${touchZoomScale})`,
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            } : undefined} loading="lazy" />
              
              {product.images && product.images.length > 1 && <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 sm:h-10 sm:w-10" onClick={prevImage}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8 sm:h-10 sm:w-10" onClick={nextImage}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>}
            </div>
            
            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                {product.images.map((image, index) => <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${currentImageIndex === index ? 'border-primary' : 'border-border'}`}>
                    <img src={image || "/api/placeholder/80/80"} alt={`${product.name} ${index + 1}`} className="object-cover w-full h-full" />
                  </button>)}
              </div>}
          </div>

          {/* Product Info - Dark Card Design */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Title */}
            <div>
              
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{product.name}</h1>
            </div>

            {/* Dark Purchase Card */}
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Buy Now for</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{product.price}</p>
                  {/* Section 1 - Regular Price Strikethrough */}
                  {product.original_price && product.original_price > product.price && (
                    <p className="text-sm text-[#6B7280] mt-1">
                      Regular Price: <span className="line-through">₹{product.original_price}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-primary">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Price is Below Regular Price</span>
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-sm sm:text-base font-medium text-foreground">SIZE</h3>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {product.sizes.map(size => <button key={size} onClick={() => setSelectedSize(size)} className={`py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all min-h-[44px] ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'}`}>
                        {size}
                      </button>)}
                  </div>
                </div>}

              <Button onClick={handleAddToCart} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 sm:py-4 rounded-xl text-base sm:text-lg min-h-[48px]" size="lg">
                ADD TO CART
              </Button>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  Last Sale: ₹{Math.floor(product.price * (1 + (Math.random() * 0.1 + 0.1)))}
                </span>
                <button onClick={() => setShowSizeChart(true)} className="text-primary hover:underline">
                  View Size Chart
                </button>
              </div>
            </div>

            {/* Section 2 - Feature Highlights Box */}
            <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Why You'll Love This Tee
              </h3>
              <div className="space-y-2">
                {[
                  "Super-soft Premium Cotton",
                  "Perfect Regular Fit",
                  "Fade-Resistant Print",
                  "7-Day Hassle-Free Size Exchange",
                  "Sweat-Friendly Fabric"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>100% Money-Back Guarantee</span>
                </div>
              </div>
            </div>

            {/* Section 3 - Trust Badge Box */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-xl p-4">
              <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">COD Available</p>
                    <p className="text-[10px] text-green-600/80 dark:text-green-500/80">Pay on Delivery</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-green-200 dark:bg-green-700/50"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">100% Secure</p>
                    <p className="text-[10px] text-green-600/80 dark:text-green-500/80">Safe Payments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Policy Section */}
            <div className="text-center">
              <button className="text-sm sm:text-base text-primary hover:underline font-medium">
                7 Days Return and Exchange Available →
              </button>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-2 sm:space-y-3">
              <details className="group">
                <summary className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80 min-h-[48px]">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6">🛡️</div>
                    <span className="font-medium text-sm sm:text-base">Worry Free Purchasing</span>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">
                  Every item is verified by our team. We guarantee best experience or your money back.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80 min-h-[48px]">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6">🤝</div>
                    <span className="font-medium text-sm sm:text-base">Buyer Promise</span>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">
                  Fast shipping, secure packaging, and hassle-free returns within 30 days.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80 min-h-[48px]">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                    <div className="w-5 h-5 sm:w-6 sm:h-6">⚙️</div>
                    <span className="font-medium text-sm sm:text-base">Our Process</span>
                    <span className="px-2 py-0.5 text-primary-foreground text-[10px] sm:text-xs rounded-full bg-[#116b05]">
                      Quality Assurance 
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">
                  Multi-point authentication process including material analysis, construction verification, and detailed inspection before dispatching.  
                </div>
              </details>
            </div>

            {product.description && <div className="bg-card rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">About This Item</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>}
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-8 sm:mt-12 md:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">Customer Reviews</h2>
          <ProductReviews />
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && <div className="mt-8 sm:mt-12 md:mt-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map(relatedProduct => <div key={relatedProduct.id} className="product-card">
                  <a href={`/product/${relatedProduct.slug}`} className="block">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img src={relatedProduct.thumbnail_image || (relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : null) || "/api/placeholder/300/300"} alt={relatedProduct.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{relatedProduct.brand}</p>
                      <h3 className="font-semibold text-foreground line-clamp-2 text-xs sm:text-sm md:text-base leading-tight">
                        {relatedProduct.name}
                      </h3>
                      <span className="price-pill text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">₹{relatedProduct.price}</span>
                    </div>
                  </a>
                </div>)}
            </div>
          </div>}
      </div>

      {/* Size Chart Slide Up Panel */}
      {showSizeChart && <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeChart(false)} />
          
          {/* Slide Up Panel */}
          <div className="relative w-full bg-background rounded-t-2xl animate-fade-in max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Size Chart</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSizeChart(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Size Chart Content */}
            <div className="p-6 space-y-4">
              {/* Size Chart Title */}
              <div className="flex justify-center mb-4">
                <div className="border-2 border-foreground rounded-full px-6 py-2">
                  <span className="font-bold text-foreground tracking-wide">SIZE CHART</span>
                </div>
              </div>
              
              {/* Size Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-foreground">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      <th className="py-3 px-6 text-center font-bold text-foreground border-r border-foreground">SIZE</th>
                      <th className="py-3 px-6 text-center font-bold text-foreground border-r border-foreground">CHEST</th>
                      <th className="py-3 px-6 text-center font-bold text-foreground">LENGTH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: 'XS', chest: '40', length: '27' },
                      { size: 'S', chest: '42', length: '28' },
                      { size: 'M', chest: '44', length: '29' },
                      { size: 'L', chest: '46', length: '30' },
                      { size: 'XL', chest: '48', length: '31' },
                      { size: '2XL', chest: '50', length: '32' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-foreground last:border-b-0">
                        <td className="py-3 px-6 text-center font-semibold text-foreground border-r border-foreground">{row.size}</td>
                        <td className="py-3 px-6 text-center text-foreground border-r border-foreground">{row.chest}</td>
                        <td className="py-3 px-6 text-center text-foreground">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Measurement Note */}
              <p className="text-sm text-muted-foreground text-center italic">
                *All measurements are in inches.
              </p>
            </div>
          </div>
        </div>}
    </Layout>;
};
export default ProductDetail;