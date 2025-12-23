import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What types of products does Symbole offer?",
    answer: "We specialize in premium imported jackets, apparels, and fashion accessories. Our collection includes bomber jackets, leather jackets, denim wear, hoodies, casual wear, and more - all sourced from top international brands and designers."
  },
  {
    question: "Are your products authentic?",
    answer: "Absolutely! All our products are 100% authentic and sourced directly from authorized distributors and brands. We guarantee the quality and authenticity of every item we sell."
  },
  {
    question: "Do you offer international sizing?",
    answer: "Yes! We provide detailed size charts for all our products including conversions for US, EU, UK, and Asian sizes. We recommend checking the size guide for each product to ensure the perfect fit."
  },
  {
    question: "How is the quality of imported products?",
    answer: "Our imported products are built to last with premium materials and expert craftsmanship. We carefully select each brand and item based on quality standards, ensuring durability and style that stands the test of time."
  },
  {
    question: "Who shops at Symbole?",
    answer: "Everyone! Whether you're a fashion enthusiast, outdoor adventurer, or someone who values quality and style, our diverse collection of imported jackets and apparels has something for every lifestyle and preference."
  },
  {
    question: "What if I'm not satisfied with my purchase?",
    answer: "We offer a 30-day satisfaction guarantee and 1-year warranty on manufacturing defects. If you're not completely satisfied with your purchase, we'll provide a full refund or exchange within 30 days."
  }
];

const FAQ = () => {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-0">
          {faqData.map((item, index) => (
            <div key={index} className="border-b border-gray-800">
              <button
                onClick={() => toggleItem(index)}
                className="w-full py-6 px-0 flex items-center justify-between text-left hover:bg-gray-900/50 transition-colors"
              >
                <h3 className="text-white font-medium text-lg pr-4">
                  {item.question}
                </h3>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-white transition-transform duration-200 flex-shrink-0",
                    openItem === index ? "rotate-180" : ""
                  )}
                />
              </button>
              {openItem === index && (
                <div className="pb-6 px-0">
                  <p className="text-gray-300 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;