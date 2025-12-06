import { Search, ShoppingCart, Menu, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import CartSidebar from "@/components/cart/CartSidebar";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { theme, setTheme } = useTheme();
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4 bg-background">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="Symbole - Imported Jackets & Apparels" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              All
            </Link>
            <Link to="/jackets" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Jackets
            </Link>
            <Link to="/new-arrivals" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              New Arrivals
            </Link>
            <Link to="/track-order" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Track Order
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search for products..." className="pl-10 bg-card border-border" />
            </div>
          </div>

          {/* Theme Toggle, Cart & Mobile Menu */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <CartSidebar>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>}
              </Button>
            </CartSidebar>
            
            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-sm font-medium text-foreground">All</Link>
              <Link to="/jackets" className="text-sm font-medium text-muted-foreground">Jackets</Link>
              <Link to="/new-arrivals" className="text-sm font-medium text-muted-foreground">New Arrivals</Link>
              <Link to="/track-order" className="text-sm font-medium text-muted-foreground">Track Order</Link>
            </nav>
            
            {/* Mobile Search */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search for products..." className="pl-10 bg-card border-border" />
              </div>
            </div>
          </div>}
      </div>
    </header>;
};
export default Header;