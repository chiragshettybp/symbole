import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";

const Terms = () => {
  return <Layout>
      <SEOHead 
        title="Terms & Conditions"
        description="Read Symbole's terms and conditions for using our website and services."
        url="/terms"
      />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2024
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Symbole , you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
                <p className="text-muted-foreground mb-3">
                  Permission is granted to temporarily access the materials on Symbole for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or public display</li>
                  <li>Attempt to reverse engineer any software contained on our website</li>
                  <li>Remove any copyright or proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Product Information</h2>
                <p className="text-muted-foreground">
                  We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Pricing and Payment</h2>
                <p className="text-muted-foreground">
                  All prices are listed in Indian Rupees (INR) and are subject to change without notice. We accept various payment methods including credit cards, debit cards, and cash on delivery. Payment must be received in full before orders are processed.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Order Acceptance</h2>
                <p className="text-muted-foreground">
                  We reserve the right to refuse or cancel any order for any reason, including product availability, errors in pricing or product information, or suspected fraudulent activity. If your order is canceled after payment has been processed, we will issue a full refund.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Account Security</h2>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. Please notify us immediately of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content on this website, including text, graphics, logos, images, and software, is the property of Symbole and is protected by copyright and trademark laws. Unauthorized use of any content may violate copyright, trademark, and other laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Symbole shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website or products, even if we have been advised of the possibility of such damages.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms & Conditions, please contact us through our customer support channels.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>;
};
export default Terms;