import { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import CartSidebar from "@/components/cart/CartSidebar";
import cartIcon from "@/assets/cart-icon.svg";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SearchDialog from "@/components/search/SearchDialog";

const Header = () => {
  const { cartCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Menu Trigger & Logo */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9" aria-label="Open navigation menu" />
            <Link to="/" className="flex items-center space-x-2" aria-label="Symbole - Go to homepage">
              <img 
                alt="Symbole logo" 
                className="h-6 sm:h-8 w-auto max-w-[140px] sm:max-w-[180px] object-contain" 
                src="/lovable-uploads/fd6a3364-2e6b-4ae0-a7e7-17f87b52ec21.png" 
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
              All
            </Link>
            <Link to="/new-arrivals" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
              New Arrivals
            </Link>
            <Link to="/track-order" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
              Track Order
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <button 
              onClick={() => setSearchOpen(true)}
              className="relative w-full group"
              aria-label="Open search dialog"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                <Input 
                  placeholder="Search for products..." 
                  className="pl-10 bg-card border-border cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-ring" 
                  readOnly
                  tabIndex={-1}
                />
              </div>
            </button>
          </div>

          {/* Mobile Search & Cart */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
            
            <CartSidebar>
              <Button variant="ghost" size="icon" className="relative focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Shopping cart with ${cartCount} items`}>
                <img src={cartIcon} alt="" className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                    {cartCount}
                  </span>
                )}
              </Button>
            </CartSidebar>
          </div>
        </div>
      </div>
      
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
};

export default Header;