import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";

const Sale = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="destructive" className="mb-4">Limited Time</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Sale & Special Offers
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't miss out on amazing deals on premium sneakers. 
              Limited stock available at unbeatable prices.
            </p>
          </div>
          
          <ProductGrid />
        </div>
      </section>
    </Layout>
  );
};

export default Sale;
