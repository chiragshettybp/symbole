import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, PackageCheck, RefreshCw, Shield } from "lucide-react";

const Shipping = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Shipping & Returns
            </h1>
            <p className="text-muted-foreground">
              Everything you need to know about delivery and returns
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-primary" />
                  <CardTitle>Shipping Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Delivery Time</h3>
                  <p className="text-muted-foreground">
                    Standard delivery takes 5-7 business days. Express delivery available for select locations (2-3 business days).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Shipping Costs</h3>
                  <p className="text-muted-foreground">
                    Free shipping on orders over ₹2,999. Standard shipping fee of ₹199 applies to orders below this amount.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Tracking</h3>
                  <p className="text-muted-foreground">
                    Track your order anytime using our order tracking page. You'll receive tracking information via email once your order ships.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-6 w-6 text-primary" />
                  <CardTitle>Packaging</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All sneakers are carefully packaged in their original boxes with protective materials to ensure they arrive in perfect condition.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  <CardTitle>Returns & Exchange Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">30-Day Return Window</h3>
                  <p className="text-muted-foreground">
                    We accept returns within 30 days of delivery. Products must be unworn, in original condition with all tags attached.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">How to Return</h3>
                  <p className="text-muted-foreground">
                    Contact our customer support team to initiate a return. We'll provide you with a return shipping label and instructions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Refund Process</h3>
                  <p className="text-muted-foreground">
                    Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Exchange Policy</h3>
                  <p className="text-muted-foreground">
                    We offer size exchanges for the same product subject to availability. Contact us within 7 days of delivery to arrange an exchange.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Quality Guarantee</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All our products are 100% authentic. If you receive a defective or damaged product, we'll provide a full refund or replacement at no additional cost.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Shipping;
