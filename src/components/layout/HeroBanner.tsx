import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  return (
    <section className="w-full" aria-label="Hero banner showcasing Symbole collection">
      <img 
        src={heroBanner} 
        alt="Symbole premium fashion collection featuring stylish apparel and jackets" 
        className="w-full h-auto object-cover"
      />
    </section>
  );
};

export default HeroBanner;
