import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .neq('visible', false)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category],
    queryFn: async () => {
      if (!product) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', product.id)
        .neq('visible', false)
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!product
  });

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    await addToCart(product.id, selectedSize, selectedColor || product.colors?.[0] || 'black', quantity);
  };

  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  if (isLoading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </Layout>
    );
  }

  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div 
              className="relative overflow-hidden rounded-2xl aspect-square cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={
                  product.images && product.images.length > 0
                    ? product.images[currentImageIndex] 
                    : product.thumbnail_image || "/api/placeholder/600/600"
                }
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
                loading="lazy"
              />
              
              {product.images && product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={image || "/api/placeholder/80/80"}
                      alt={`${product.name} ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Dark Card Design */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <p className="text-muted-foreground mb-2">{product.brand}</p>
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            </div>

            {/* Dark Purchase Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Buy Now for</p>
                  <p className="text-3xl font-bold text-foreground">₹{product.price}</p>
                </div>
                <div className="flex items-center space-x-2 text-primary">
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Price is Below Retail</span>
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">SIZE</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl text-lg"
                size="lg"
              >
                ADD TO CART
              </Button>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Last Sale: ₹{Math.floor(product.price * (1 + (Math.random() * 0.1 + 0.1)))}
                </span>
                <button 
                  onClick={() => setShowSizeChart(true)}
                  className="text-primary hover:underline"
                >
                  View Size Chart
                </button>
              </div>
            </div>

            {/* Sell Section */}
            <div className="text-center">
              <button className="text-primary hover:underline font-medium">
                Sell Now for ₹{Math.floor(product.price * 0.8)} or Ask for More →
              </button>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-3">
              <details className="group">
                <summary className="flex items-center justify-between py-4 px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6">🛡️</div>
                    <span className="font-medium">Worry Free Purchasing</span>
                  </div>
                  <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-6 text-sm text-muted-foreground">
                  Every item is verified by our team of authenticators. We guarantee authenticity or your money back.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between py-4 px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6">🤝</div>
                    <span className="font-medium">Buyer Promise</span>
                  </div>
                  <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-6 text-sm text-muted-foreground">
                  Fast shipping, secure packaging, and hassle-free returns within 30 days.
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between py-4 px-6 bg-card rounded-xl cursor-pointer hover:bg-card/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6">⚙️</div>
                    <span className="font-medium">Our Process</span>
                    <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                      Condition: New
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-6 text-sm text-muted-foreground">
                  Multi-point authentication process including material analysis, construction verification, and detailed inspection.
                </div>
              </details>
            </div>

            {product.description && (
              <div className="bg-card rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">About This Item</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="product-card">
                  <a href={`/product/${relatedProduct.slug}`} className="block">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={
                          relatedProduct.thumbnail_image ||
                          (relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : null) ||
                          "/api/placeholder/300/300"
                        }
                        alt={relatedProduct.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">{relatedProduct.brand}</p>
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <span className="price-pill">₹{relatedProduct.price}</span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Chart Slide Up Panel */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSizeChart(false)}
          />
          
          {/* Slide Up Panel */}
          <div className="relative w-full bg-background rounded-t-2xl animate-fade-in max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Size Chart</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSizeChart(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Size Chart Content */}
            <div className="p-6 space-y-8">
              {/* Men's Shoes */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">MEN'S SHOES</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-4 text-left bg-muted font-semibold">EU</th>
                        <th className="py-2 px-4 text-left bg-muted font-semibold">US</th>
                        <th className="py-2 px-4 text-left bg-muted font-semibold">Heel to toe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { eu: '36', us: '4', heel: '22.5 cm' },
                        { eu: '37', us: '4.5', heel: '23 cm' },
                        { eu: '37.5', us: '5', heel: '23.5 cm' },
                        { eu: '38', us: '5.5', heel: '23.7 cm' },
                        { eu: '38.5', us: '5.5', heel: '24.2 cm' },
                        { eu: '39', us: '6', heel: '24.5 cm' },
                        { eu: '39.5', us: '6', heel: '24.7 cm' },
                        { eu: '40', us: '6.5', heel: '25.2 cm' },
                        { eu: '40.5', us: '7', heel: '25.5 cm' },
                        { eu: '41', us: '7.5', heel: '25.8 cm' },
                        { eu: '41.5', us: '8', heel: '26.3 cm' },
                        { eu: '42', us: '8.5', heel: '26.5 cm' },
                        { eu: '42.5', us: '9', heel: '27 cm' },
                        { eu: '43', us: '9', heel: '27.3 cm' },
                        { eu: '43.5', us: '9.5', heel: '27.5 cm' },
                        { eu: '44', us: '10', heel: '28 cm' },
                        { eu: '44.5', us: '10', heel: '28.3 cm' },
                        { eu: '45', us: '10.5', heel: '28.6 cm' },
                        { eu: '45.5', us: '11', heel: '29 cm' },
                        { eu: '46', us: '11.5', heel: '29.3 cm' },
                        { eu: '46.5', us: '11.5', heel: '29.6 cm' },
                        { eu: '47', us: '12', heel: '30 cm' },
                        { eu: '48', us: '13', heel: '30.5 cm' },
                        { eu: '49', us: '13', heel: '31 cm' },
                        { eu: '50', us: '14', heel: '31.5 cm' }
                      ].map((size, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="py-2 px-4 text-foreground">{size.eu}</td>
                          <td className="py-2 px-4 text-foreground">{size.us}</td>
                          <td className="py-2 px-4 text-foreground">{size.heel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Women's Shoes */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">WOMEN'S SHOES</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 px-4 text-left bg-muted font-semibold">EU</th>
                        <th className="py-2 px-4 text-left bg-muted font-semibold">US</th>
                        <th className="py-2 px-4 text-left bg-muted font-semibold">Heel to toe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { eu: '36', us: '5', heel: '22.5 cm' },
                        { eu: '37', us: '5.5', heel: '23 cm' },
                        { eu: '37.5', us: '6', heel: '23.5 cm' },
                        { eu: '38', us: '6.5', heel: '23.7 cm' },
                        { eu: '38.5', us: '7', heel: '24 cm' },
                        { eu: '39', us: '7.5', heel: '24.5 cm' },
                        { eu: '39.5', us: '7.5', heel: '24.7 cm' },
                        { eu: '40', us: '8', heel: '25.2 cm' },
                        { eu: '40.5', us: '8.5', heel: '25.5 cm' },
                        { eu: '41', us: '8.5', heel: '25.7 cm' },
                        { eu: '41.5', us: '9', heel: '26.2 cm' },
                        { eu: '42', us: '9.5', heel: '26.5 cm' },
                        { eu: '42.5', us: '10', heel: '26.8 cm' },
                        { eu: '43', us: '10.5', heel: '27.2 cm' },
                        { eu: '43.5', us: '11', heel: '27.5 cm' },
                        { eu: '44', us: '11', heel: '27.8 cm' }
                      ].map((size, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="py-2 px-4 text-foreground">{size.eu}</td>
                          <td className="py-2 px-4 text-foreground">{size.us}</td>
                          <td className="py-2 px-4 text-foreground">{size.heel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductDetail;