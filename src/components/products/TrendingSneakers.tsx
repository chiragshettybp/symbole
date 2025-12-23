import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    return <section className="bg-background py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Collection</h2>
            <p className="text-muted-foreground mt-2">Browse our latest designs</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({
            length: 8
          }).map((_, i) => <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-2 w-20"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
              </div>)}
          </div>
        </div>
      </section>;
  }
  if (!products || products.length === 0) {
    return null;
  }

  return <section className="bg-background py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Our Collection</h2>
          <p className="text-muted-foreground mt-2">Browse our latest statement tees</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => {
          const currentImageIndex = selectedImages[product.id] || 0;
          const discount = product.original_price 
            ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
            : 0;
          
          return <Link key={product.id} to={`/product/${product.slug}`} className="block group">
                <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square bg-muted">
                    <img 
                      src={product.images[currentImageIndex] || product.images[0] || "/placeholder.svg"} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy" 
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  
                  <div className="p-3 sm:p-4">
                    {/* Thumbnail images */}
                    {product.images.length > 1 && <div className="flex gap-1.5 mb-2">
                        {product.images.slice(0, 4).map((img, imgIndex) => <div 
                            key={imgIndex} 
                            className={`w-8 sm:w-10 aspect-square rounded-md overflow-hidden bg-muted cursor-pointer border-2 transition-all ${currentImageIndex === imgIndex ? 'border-primary' : 'border-border/50 hover:border-primary/50'}`} 
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedImages(prev => ({
                                ...prev,
                                [product.id]: imgIndex
                              }));
                            }}
                          >
                            <img src={img} alt={`${product.name} view ${imgIndex + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          </div>)}
                      </div>}
                  
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    
                    <h3 className="font-medium text-foreground text-sm leading-snug mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                  
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>;
        })}
        </div>
      </div>
    </section>;
};
export default TrendingSneakers;