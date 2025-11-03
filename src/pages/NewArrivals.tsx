import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";

const NewArrivals = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Fresh Drops</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              New Arrivals
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the latest additions to our premium sneaker collection. 
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
