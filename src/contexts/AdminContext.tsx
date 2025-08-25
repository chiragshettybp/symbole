import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminContextType {
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  logActivity: (entityType: string, entityId: string | null, action: string, summary: string, beforeData?: any, afterData?: any) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_PIN = '23112004';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const { toast } = useToast();

  const login = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const logActivity = async (
    entityType: string,
    entityId: string | null,
    action: string,
    summary: string,
    beforeData?: any,
    afterData?: any
  ) => {
    try {
      await supabase.from('admin_activity_log').insert({
        admin_id: 'admin', // In a real app, this would be the actual admin user ID
        entity_type: entityType,
        entity_id: entityId,
        action,
        summary,
        before_data: beforeData,
        after_data: afterData
      });
    } catch (error) {
      console.error('Failed to log admin activity:', error);
    }
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      logActivity
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};