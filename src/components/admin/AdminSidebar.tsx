import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Truck, 
  ShoppingBag,
  Users,
  FileText,
  Settings,
  History,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: Package },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Shipments", url: "/admin/shipments", icon: Truck },
  { title: "Products", url: "/admin/products", icon: ShoppingBag },
  { title: "Customers", url: "/admin/customers", icon: Users },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Audit Log", url: "/admin/audit", icon: History },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { logout } = useAdmin();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? "bg-primary text-primary-foreground font-medium" : "hover:bg-white/10 text-white";

  return (
    <Sidebar className="transition-all duration-300 ease-in-out" collapsible="icon">
      <SidebarContent className="bg-black">
        <SidebarGroup>
          <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : "text-white"}>
            Ordify Admin
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {state !== "collapsed" && <span className="ml-2 text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-sm text-white hover:bg-white/10"
            size="sm"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {state !== "collapsed" && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}