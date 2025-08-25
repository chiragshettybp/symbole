import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveStats {
  totalRevenue: number;
  netRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  refundedAmount: number;
  activeUsers: number;
}

export const useLiveAnalytics = () => {
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalRevenue: 0,
    netRevenue: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    refundedAmount: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveStats = async () => {
    try {
      setIsLoading(true);

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Fetch all refunds  
      const { data: refunds, error: refundsError } = await supabase
        .from('refunds')
        .select('*');

      if (refundsError) throw refundsError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      
      const deliveredOrders = orders?.filter(order => 
        ['delivered', 'completed'].includes(order.status.toLowerCase())
      ).length || 0;
      
      const cancelledOrders = orders?.filter(order => 
        order.status.toLowerCase() === 'cancelled'
      ).length || 0;
      
      const pendingOrders = orders?.filter(order => 
        ['pending', 'processing', 'paid', 'shipped'].includes(order.status.toLowerCase())
      ).length || 0;

      // Calculate revenue from payments where status is 'paid' or similar
      const paidPayments = payments?.filter(payment => 
        ['paid', 'completed', 'success'].includes(payment.status.toLowerCase())
      ) || [];
      
      const totalRevenue = paidPayments.reduce((sum, payment) => 
        sum + Number(payment.amount), 0
      );

      // Calculate refunded amount
      const refundedAmount = refunds?.reduce((sum, refund) => 
        sum + Number(refund.amount), 0
      ) || 0;

      // Net revenue = Total revenue - Refunded amount
      const netRevenue = totalRevenue - refundedAmount;

      // Average order value = Total revenue / Delivered orders
      const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

      // Active users (users who placed orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentOrders = orders?.filter(order => 
        new Date(order.created_at) >= thirtyDaysAgo
      ) || [];
      
      const activeUsers = new Set(recentOrders.map(order => order.customer_email)).size;

      setLiveStats({
        totalRevenue,
        netRevenue,
        avgOrderValue,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        pendingOrders,
        refundedAmount,
        activeUsers,
      });

    } catch (error) {
      console.error('Error fetching live analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();

    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        fetchLiveStats();
      })
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'payments' 
      }, () => {
        fetchLiveStats();
      })
      .subscribe();

    const refundsChannel = supabase
      .channel('refunds-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'refunds' 
      }, () => {
        fetchLiveStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(refundsChannel);
    };
  }, []);

  return { liveStats, isLoading, refresh: fetchLiveStats };
};