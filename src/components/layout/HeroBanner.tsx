import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  return (
    <section className="relative w-full" aria-label="Hero banner showcasing Symbole collection">
      <img 
        src={heroBanner} 
        alt="Symbole premium streetwear collection" 
        className="w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] object-cover"
      />
      
      {/* Overlay with CTA */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
        <div className="container mx-auto px-4 pb-12 sm:pb-16 lg:pb-20">
          <div className="max-w-xl">
            <p className="text-white/80 text-sm sm:text-base font-medium mb-2 tracking-wider uppercase">
              Premium Streetwear
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Express Yourself with Statement Tees
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-6 max-w-md">
              Curated collection of bold, expressive t-shirts designed to make a statement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/new-arrivals">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold px-6">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/new-arrivals">
                <Button size="lg" variant="outline" className="border-white/80 bg-white/10 text-white hover:bg-white/20 font-semibold px-6 backdrop-blur-sm">
                  View Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
