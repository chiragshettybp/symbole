import { Link, useLocation } from "react-router-dom";
import { Search, Home, Sparkles, Tag, Package, HelpCircle, Truck, FileText, Shield, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "New Arrivals", url: "/new-arrivals", icon: Sparkles },
  { title: "Sale", url: "/sale", icon: Tag },
];

const supportItems = [
  { title: "Track Order", url: "/track-order", icon: Package },
  { title: "Shipping Info", url: "/shipping", icon: Truck },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
];

const legalItems = [
  { title: "Refund & Return", url: "/refund-return", icon: RotateCcw },
  { title: "Shipping Policy", url: "/shipping-policy", icon: Truck },
  { title: "Terms & Conditions", url: "/terms", icon: FileText },
  { title: "Privacy Policy", url: "/privacy", icon: Shield },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center" onClick={handleLinkClick}>
            <img 
              alt="Ordify" 
              className="h-7 w-auto object-contain" 
              src="/lovable-uploads/fd6a3364-2e6b-4ae0-a7e7-17f87b52ec21.png" 
            />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8"
            onClick={() => setOpenMobile(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Quick search..." 
            className="pl-10 bg-card border-border h-10 text-sm" 
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Shop Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Shop
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Legal Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Legal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {legalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © 2024 Ordify. All rights reserved.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
