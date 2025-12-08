import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}
const FooterSection = ({
  title,
  children
}: FooterSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return <>
      {/* Mobile: Collapsible */}
      <div className="md:hidden border-t border-border">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-4 text-left">
            <span className="font-medium text-foreground">{title}</span>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            <div className="space-y-3">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:block space-y-4">
        <h3 className="font-medium text-foreground">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </>;
};
const Footer = () => {
  return <footer className="w-full bg-background">
      <div className="container mx-auto px-4 bg-white">
        {/* Main Footer Sections */}
        <div className="md:grid md:grid-cols-4 md:gap-8 md:py-12">
          {/* Help Section */}
          <FooterSection title="Help">
            <Link to="/track-order" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Track Order
            </Link>
            <Link to="/shipping" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Delivery & Returns
            </Link>
            <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </FooterSection>

          {/* Company Section */}
          <FooterSection title="Company">
            <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              About Ordify
            </Link>
            <Link to="/new-arrivals" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              New Arrivals
            </Link>
            <Link to="/sale" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sale
            </Link>
          </FooterSection>

          {/* Shop Section */}
          <FooterSection title="Shop">
            <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              All Products
            </Link>
            <Link to="/jackets" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Jackets
            </Link>
          </FooterSection>

          {/* Contact Section */}
          <FooterSection title="Contact">
            <p className="text-sm text-muted-foreground">support@ordify.com</p>
            <p className="text-sm text-muted-foreground">Mon - Sat, 10AM - 6PM</p>
          </FooterSection>
        </div>

        {/* Location */}
        <div className="py-4 border-t border-border md:border-t-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>India</span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col gap-4">
            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © 2025 Ordify. All rights reserved
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Guides
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  <Link to="/shipping" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Shipping Guide
                  </Link>
                  <Link to="/faq" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Size Guide
                  </Link>
                </CollapsibleContent>
              </Collapsible>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Sale
              </Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Use
              </Link>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;