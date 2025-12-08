import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number;
  images: string[];
  brand: string;
  featured?: boolean;
}
const TrendingSneakers = () => {
  const [selectedImages, setSelectedImages] = useState<Record<string, number>>({});
  const {
    data: products,
    isLoading
  } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('products').select('*').neq('visible', false).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as Product[];
    }
  });
  if (isLoading) {
    return <section className="bg-background py-8 md:hidden">
        <div className="px-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-foreground">Trending Products</h2>
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({
            length: 4
          }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-2 w-20"></div>
                <div className="h-5 bg-muted rounded mb-2 w-16"></div>
                <div className="flex items-center gap-1">
                  <div className="h-3 bg-muted rounded w-12"></div>
                  <div className="w-3 h-3 bg-muted rounded"></div>
                </div>
              </div>)}
          </div>
        </div>
      </section>;
  }
  if (!products || products.length === 0) {
    return null;
  }

  // Generate random sales data between 0-15
  const generateSalesData = () => {
    return Math.floor(Math.random() * 16); // 0 to 15
  };
  return <section className="bg-background py-8 md:hidden">
      <div className="px-4 bg-white">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold text-foreground">Trending Products</h2>
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, index) => {
          const currentImageIndex = selectedImages[product.id] || 0;
          return <Link key={product.id} to={`/product/${product.slug}`} className="block group">
                <div className="relative mb-2">
                  <div className="rounded-xl overflow-hidden aspect-square bg-muted">
                    <img src={product.images[currentImageIndex] || product.images[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                </div>
                
                {/* Thumbnail images */}
                {product.images.length > 1 && <div className="flex gap-1.5 mb-2">
                    {product.images.slice(0, 4).map((img, imgIndex) => <div key={imgIndex} className={`w-10 aspect-[4/5] rounded-md overflow-hidden bg-muted cursor-pointer border-2 transition-all ${currentImageIndex === imgIndex ? 'border-primary' : 'border-border/50 hover:border-primary/50'}`} onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedImages(prev => ({
                  ...prev,
                  [product.id]: imgIndex
                }));
              }}>
                        <img src={img} alt={`${product.name} view ${imgIndex + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>)}
                  </div>}
              
                <h3 className="font-medium text-foreground text-sm leading-snug mb-1 line-clamp-2">
                  {product.name}
                </h3>
              
                <p className="text-xs text-muted-foreground mb-1">
                  Lowest Ask
                </p>
              
                <p className="text-base font-bold text-foreground mb-1">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
              
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{generateSalesData()} sold in last 7 days</span>
                </div>
              </Link>;
        })}
        </div>
      </div>
    </section>;
};
export default TrendingSneakers;