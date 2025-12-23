import Layout from "@/components/layout/Layout";
import TrendingSneakers from "@/components/products/TrendingSneakers";
import HeroBanner from "@/components/layout/HeroBanner";
import ValueProposition from "@/components/home/ValueProposition";
import SEOHead from "@/components/seo/SEOHead";

const Index = () => {
  return (
    <Layout>
      <SEOHead 
        title="Symbole - Premium Fashion & Apparel"
        description="Discover premium imported jackets, apparels, and trending styles at Symbole. Fresh styles, exclusive drops, and quality fashion."
        url="/"
      />
      {/* Hero Banner */}
      <HeroBanner />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Product Collection */}
      <TrendingSneakers />
    </Layout>
  );
};

export default Index;