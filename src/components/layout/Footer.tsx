import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-xl font-bold">
              <span className="text-primary">Ordify</span>
              <span className="text-foreground"> Sneakers</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium sneakers for every style and occasion.
            </p>
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

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Ordify Sneakers. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Created by <span className="text-primary">Ordify</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;