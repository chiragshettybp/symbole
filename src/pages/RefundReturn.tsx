import Layout from "@/components/layout/Layout";

const RefundReturn = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Refund & Return Policy</h1>
        
        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Return Policy</h2>
            <p className="mb-4">
              We want you to be completely satisfied with your purchase. If you're not happy with your order, 
              you can return it within 7 days of delivery for a full refund or exchange.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Items must be unused and in their original packaging</li>
              <li>Tags must be attached and intact</li>
              <li>Items must not be washed, altered, or damaged</li>
              <li>Sale items are final and cannot be returned</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">How to Initiate a Return</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our customer support via email or phone</li>
              <li>Provide your order number and reason for return</li>
              <li>Once approved, pack the item securely</li>
              <li>Ship the item to our return address</li>
              <li>Refund will be processed within 5-7 business days after receiving the item</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Refund Process</h2>
            <p className="mb-4">
              Refunds will be credited to your original payment method within 5-7 business days 
              after we receive and inspect the returned item.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Original shipping charges are non-refundable</li>
              <li>Return shipping costs are the responsibility of the customer</li>
              <li>For defective items, we cover return shipping</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Exchange Policy</h2>
            <p>
              If you'd like to exchange an item for a different size or color, please follow the return 
              process and place a new order for the desired item. This ensures faster processing and 
              availability of your preferred item.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              For any questions about returns or refunds, please contact us at{" "}
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

export default RefundReturn;
