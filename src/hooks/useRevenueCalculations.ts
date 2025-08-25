import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  avgOrderValue: number;
  totalRefunds: number;
  todaysCapturedAmount: number;
  todaysRefundAmount: number;
  netRevenue: number;
  totalCapturedAmount: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface Order {
  id: string;
  total: number;
  discount: number;
  status: string;
  created_at: string;
  order_items?: Array<{
    quantity: number;
    unit_price: number;
    line_total: number;
    name_snapshot: string;
  }>;
}

interface Refund {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method: string;
  slip_url?: string;
  created_at: string;
  updated_at: string;
}

export const useRevenueCalculations = (dateRange?: DateRange) => {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    avgOrderValue: 0,
    totalRefunds: 0,
    todaysCapturedAmount: 0,
    todaysRefundAmount: 0,
    netRevenue: 0,
    totalCapturedAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateRevenue = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting revenue calculation...');

      // Fetch orders with order items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          discount,
          status,
          created_at,
          order_items (
            quantity,
            unit_price,
            line_total,
            name_snapshot
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch refunds
      const { data: refunds, error: refundsError } = await supabase
        .from('refunds')
        .select('*');

      if (refundsError) throw refundsError;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      console.log('Raw data:', { 
        ordersCount: orders?.length || 0, 
        refundsCount: refunds?.length || 0, 
        paymentsCount: payments?.length || 0 
      });

      // Filter orders by date range if provided
      let filteredOrders: Order[] = orders || [];
      let filteredRefunds: Refund[] = refunds || [];
      let filteredPayments: Payment[] = payments || [];

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      if (dateRange) {
        filteredOrders = orders?.filter(order => 
          isWithinInterval(new Date(order.created_at), {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          })
        ) || [];

        filteredRefunds = refunds?.filter(refund => 
          isWithinInterval(new Date(refund.created_at), {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          })
        ) || [];

        filteredPayments = payments?.filter(payment => 
          isWithinInterval(new Date(payment.created_at), {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          })
        ) || [];
      }

      console.log('Filtered data:', { 
        filteredOrdersCount: filteredOrders.length,
        filteredRefundsCount: filteredRefunds.length,
        filteredPaymentsCount: filteredPayments.length,
        dateRange
      });

      // Categorize orders by status
      const deliveredOrders = filteredOrders.filter(order => 
        ['delivered', 'completed'].includes(order.status.toLowerCase())
      );
      
      const cancelledOrders = filteredOrders.filter(order => 
        ['cancelled', 'canceled'].includes(order.status.toLowerCase())
      );

      const pendingOrders = filteredOrders.filter(order => 
        ['pending', 'processing', 'paid', 'shipped'].includes(order.status.toLowerCase())
      );

      const refundedOrders = filteredOrders.filter(order => 
        ['refunded', 'refund_initiated'].includes(order.status.toLowerCase())
      );

      console.log('Order categorization:', {
        delivered: deliveredOrders.length,
        cancelled: cancelledOrders.length,
        pending: pendingOrders.length,
        refunded: refundedOrders.length
      });

      // Calculate revenue from delivered orders only (not including refunded orders)
      let totalRevenue = deliveredOrders.reduce((sum, order) => {
        const orderTotal = Number(order.total) || 0;
        const discount = Number(order.discount) || 0;
        const netAmount = orderTotal - discount;
        console.log(`Order ${order.id}: total=${orderTotal}, discount=${discount}, net=${netAmount}`);
        return sum + netAmount;
      }, 0);

      console.log('Total Revenue (delivered orders):', totalRevenue);

      // Calculate total refunds from actual refunds table
      const completedRefunds = filteredRefunds.filter(refund => 
        refund.status === 'completed'
      );
      
      const totalRefunds = completedRefunds.reduce((sum, refund) => {
        const amount = Number(refund.amount) || 0;
        console.log(`Refund ${refund.id}: amount=${amount}`);
        return sum + amount;
      }, 0);

      console.log('Total Refunds:', totalRefunds);

      // Calculate average order value based on delivered orders
      const avgOrderValue = deliveredOrders.length > 0 
        ? totalRevenue / deliveredOrders.length 
        : 0;

      // Calculate today's captured amount (payments with slip_url created/updated today)
      const todaysCapturedPayments = (payments || []).filter(payment => {
        const hasSlip = !!payment.slip_url;
        const isToday = isWithinInterval(new Date(payment.updated_at || payment.created_at), {
          start: startOfToday,
          end: endOfToday
        });
        if (hasSlip && isToday) {
          console.log(`Today's captured payment: ${payment.id}, amount: ${payment.amount}`);
        }
        return hasSlip && isToday;
      });
      const todaysCapturedAmount = todaysCapturedPayments.reduce((sum, payment) => {
        return sum + (Number(payment.amount) || 0);
      }, 0);

      console.log('Today\'s Captured Amount:', todaysCapturedAmount);

      // Calculate today's refund amount (orders with refunded status today OR refunds created today)
      const todaysRefundAmount = refundedOrders
        .filter(order => 
          isWithinInterval(new Date(order.created_at), {
            start: startOfToday,
            end: endOfToday
          })
        )
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      console.log('Today\'s Refund Amount:', todaysRefundAmount);

      // Calculate total captured amount for the date range (all payments with slips)
      const capturedPayments = filteredPayments.filter(payment => !!payment.slip_url);
      const totalCapturedAmount = capturedPayments.reduce((sum, payment) => {
        return sum + (Number(payment.amount) || 0);
      }, 0);

      console.log('Total Captured Amount:', totalCapturedAmount);

      // Calculate net revenue (Total Captured - Total Refunds)
      const netRevenue = totalCapturedAmount - totalRefunds;

      console.log('Net Revenue:', netRevenue);

      const finalStats = {
        totalRevenue: Math.max(0, totalRevenue),
        totalOrders: filteredOrders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        pendingOrders: pendingOrders.length,
        avgOrderValue,
        totalRefunds,
        todaysCapturedAmount,
        todaysRefundAmount,
        netRevenue,
        totalCapturedAmount,
      };

      console.log('Final calculated stats:', finalStats);

      setStats(finalStats);

    } catch (err) {
      console.error('Error calculating revenue:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateRevenue();
  }, [dateRange?.from, dateRange?.to]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('revenue-calculations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        calculateRevenue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, () => {
        calculateRevenue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        calculateRevenue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        calculateRevenue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stats,
    isLoading,
    error,
    recalculate: calculateRevenue,
  };
};

export default useRevenueCalculations;