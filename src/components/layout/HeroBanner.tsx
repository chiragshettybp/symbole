import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  return (
    <section className="w-full">
      <img 
        src={heroBanner} 
        alt="Ordify Collection Banner" 
        className="w-full h-auto object-cover"
      />
    </section>
  );
};

export default HeroBanner;
