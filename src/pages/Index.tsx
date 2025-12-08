import Layout from "@/components/layout/Layout";
import TrendingSneakers from "@/components/products/TrendingSneakers";
import HeroBanner from "@/components/layout/HeroBanner";

const Index = () => {
  return (
    <Layout>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Trending Sneakers - Mobile Only */}
      <TrendingSneakers />
    </Layout>
  );
};

export default Index;