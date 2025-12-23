import Layout from "@/components/layout/Layout";
import FAQ from "@/components/FAQ";
import SEOHead from "@/components/seo/SEOHead";

const FAQPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Symbole products, shipping, returns, and sizing. Get help with your orders."
        url="/faq"
      />
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our products and services
            </p>
          </div>
          
          <FAQ />
        </div>
      </section>
    </Layout>
  );
};

export default FAQPage;
