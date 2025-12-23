import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";

const Privacy = () => {
  return (
    <Layout>
      <SEOHead 
        title="Privacy Policy"
        description="Learn how Symbole collects, uses, and protects your personal information. Read our privacy policy."
        url="/privacy"
      />
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2024
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-3">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Name, email address, phone number, and shipping address</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Order history and preferences</li>
                  <li>Communication preferences and customer service interactions</li>
                  <li>Social media handles when voluntarily provided</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Process and fulfill your orders</li>
                  <li>Send order confirmations and shipping updates</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Improve our website and customer experience</li>
                  <li>Detect and prevent fraudulent transactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. All payment transactions are processed through secure payment gateways using industry-standard encryption.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Request correction of inaccurate or incomplete data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to or restrict processing of your data</li>
                  <li>Withdraw consent for marketing communications at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Third-Party Links</h2>
                <p className="text-muted-foreground">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our website is not directed to children under the age of 13, and we do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please contact us through our customer support channels.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
