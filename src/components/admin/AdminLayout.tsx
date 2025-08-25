import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 md:h-14 flex items-center border-b bg-background px-3 md:px-6 sticky top-0 z-40">
            <SidebarTrigger />
            <div className="ml-2 md:ml-4">
              <h1 className="font-semibold text-foreground text-sm md:text-base">Admin Panel</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            <div className="max-w-full overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}