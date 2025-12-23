import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/seo/SEOHead";

const NewArrivals = () => {
  return (
    <Layout>
      <SEOHead 
        title="New Arrivals - Latest Fashion"
        description="Shop the latest imported jackets, apparels, and trending styles. Fresh drops and exclusive designs at Symbole."
        url="/new-arrivals"
      />
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Fresh Drops</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              New Arrivals
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the latest imported jackets, apparels, and trending styles. 
              Fresh styles, exclusive drops, and trending designs.
            </p>
          </div>
          
          <ProductGrid />
        </div>
      </section>
    </Layout>
  );
};

export default NewArrivals;
