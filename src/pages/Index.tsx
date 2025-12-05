import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import TrendingSneakers from "@/components/products/TrendingSneakers";
import FAQ from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <Layout>
      {/* Trending Sneakers - Mobile Only */}
      <TrendingSneakers />

      {/* Featured Products */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Handpicked imported jackets, apparels, and more
            </p>
          </div>
          
          <ProductGrid />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />
    </Layout>
  );
};

export default Index;
