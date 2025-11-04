import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Rocket, HelpCircle } from "lucide-react";
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
  const { data: products, isLoading } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('visible', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });

  if (isLoading) {
    return (
      <section className="bg-background py-8 md:hidden">
        <div className="px-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-foreground">Trending Sneakers</h2>
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-2 w-20"></div>
                <div className="h-5 bg-muted rounded mb-2 w-16"></div>
                <div className="flex items-center gap-1">
                  <div className="h-3 bg-muted rounded w-12"></div>
                  <div className="w-3 h-3 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  // Generate random sales data between 0-15
  const generateSalesData = () => {
    return Math.floor(Math.random() * 16); // 0 to 15
  };

  return (
    <section className="bg-background py-8 md:hidden">
      <div className="px-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold text-foreground">Trending Sneakers</h2>
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {products.map((product, index) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="bg-card rounded-2xl py-4 block hover:shadow-lg transition-shadow"
            >
              <div className="relative mb-3">
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-auto object-contain block"
                    loading="lazy"
                  />
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 bg-card-foreground/10 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>
              
              <p className="text-xs text-muted-foreground mb-2">
                Lowest Ask
              </p>
              
              <p className="text-lg font-bold text-foreground mb-2">
                ₹{product.price}
              </p>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{generateSalesData()} sold</span>
                <Rocket className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSneakers;