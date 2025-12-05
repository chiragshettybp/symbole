import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">
                <span className="text-foreground">Ordify</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Premium imported jackets, apparels, and more for every style.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Shop</h3>
            <div className="space-y-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                All Products
              </Link>
              <Link to="/new-arrivals" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                New Arrivals
              </Link>
              <Link to="/sale" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Sale
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <div className="space-y-2">
              <Link to="/track-order" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Track Your Order
              </Link>
              <Link to="/shipping" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Shipping & Returns
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                FAQ
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <div className="space-y-2">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border col-span-2 md:col-span-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              &copy; 2024 Ordify. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Created by <span className="text-primary">Ordify</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;