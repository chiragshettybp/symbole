import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import TrendingSneakers from "@/components/products/TrendingSneakers";
import FAQ from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const Index = () => {
  return <Layout>
      {/* Trending Sneakers - Mobile Only */}
      <TrendingSneakers className="bg-white" />

      {/* Featured Products */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        
      </section>

      {/* FAQ Section */}
      
    </Layout>;
};
export default Index;