import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Track page views, scroll depth, and session data
  useAnalyticsTracking();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;