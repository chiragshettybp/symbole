import { Truck, RefreshCw, Shield, Clock } from "lucide-react";

const values = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On all orders across India",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "7-day hassle-free returns",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "100% authentic products",
  },
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "3-5 business days",
  },
];

const ValueProposition = () => {
  return (
    <section className="bg-card border-y border-border py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {values.map((value) => (
            <div key={value.title} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <value.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                {value.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
