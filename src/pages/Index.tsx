import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import TrendingSneakers from "@/components/products/TrendingSneakers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <Layout>
      {/* Trending Sneakers - Mobile Only */}
      <TrendingSneakers />

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Featured Sneakers
            </h2>
            <p className="text-muted-foreground">
              Handpicked selections from our premium collection
            </p>
          </div>
          
          <ProductGrid />
        </div>
      </section>
    </Layout>
  );
};

export default Index;
