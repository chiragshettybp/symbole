import Layout from "@/components/layout/Layout";
import FAQ from "@/components/FAQ";

const FAQPage = () => {
  return (
    <Layout>
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
