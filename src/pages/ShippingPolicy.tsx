import Layout from "@/components/layout/Layout";

const ShippingPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shipping Policy</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Shipping Locations</h2>
            <p>
              We currently ship to all major cities and towns across India. International shipping 
              is not available at this time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Delivery Time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Metro Cities:</strong> 3-5 business days</li>
              <li><strong>Other Cities:</strong> 5-7 business days</li>
              <li><strong>Remote Areas:</strong> 7-10 business days</li>
            </ul>
            <p className="mt-4 text-sm">
              *Delivery times may vary during peak seasons and holidays.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Shipping Charges</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prepaid Orders:</strong> FREE shipping on all prepaid orders</li>
              <li><strong>Cash on Delivery (COD):</strong> ₹49 additional charge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Order Tracking</h2>
            <p>
              Once your order is shipped, you will receive a tracking number via email and SMS. 
              You can track your order status on our <a href="/track-order" className="text-primary hover:underline">Track Order</a> page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Delivery Partners</h2>
            <p>
              We partner with trusted courier services including Delhivery, BlueDart, DTDC, and 
              India Post to ensure safe and timely delivery of your orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Failed Delivery Attempts</h2>
            <p className="mb-4">
              If delivery is unsuccessful after 3 attempts, the order will be returned to our warehouse. 
              In such cases:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prepaid orders will be refunded after deducting shipping charges</li>
              <li>You can request re-shipment by paying additional shipping charges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              For shipping-related queries, please contact us at{" "}
              <a href="mailto:support@ordify.com" className="text-primary hover:underline">
                support@ordify.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingPolicy;
