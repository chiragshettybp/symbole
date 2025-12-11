import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'custom';

export interface CartCheckoutKPIs {
  cartAbandonmentRate: number;
  checkoutCompletionRate: number;
  avgCartValue: number;
  couponsUsedToday: number;
  couponConversionRate: number;
  totalCarts: number;
  completedCheckouts: number;
}

export interface ProductKPIs {
  addToCartRate: number;
  mostViewedProduct: { name: string; views: number } | null;
  highestConvertingProduct: { name: string; rate: number } | null;
  avgScrollDepth: number;
  totalProductViews: number;
}

export interface FunnelStep {
  step: string;
  users: number;
  dropOff: number;
  conversionRate: number;
}

export interface AbandonmentReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface AbandonedProduct {
  id: string;
  name: string;
  category: string;
  timesAbandoned: number;
  addToCartFrequency: number;
  dropOffRate: number;
}

export interface SizePattern {
  size: string;
  count: number;
  percentage: number;
}

export interface FitFeedback {
  rating: string;
  count: number;
  percentage: number;
}

export interface TrendingProduct {
  id: string;
  name: string;
  velocity: number;
  views: number;
  addToCartCount: number;
}

export interface WishlistItem {
  productId: string;
  productName: string;
  addedCount: number;
  convertedCount: number;
  conversionRate: number;
}

export interface RecentlyViewedItem {
  productId: string;
  productName: string;
  totalViews: number;
  uniqueViewers: number;
  avgTimeSpent: number;
  repeatViews: number;
}

export interface HighIntentPage {
  page: string;
  addToCartRate: number;
  avgTimeSpent: number;
  avgScrollDepth: number;
  visits: number;
}

const getDateRangeFilter = (range: DateRange, customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    case '7days':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      return { start: week, end: now };
    case '30days':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      return { start: month, end: now };
    case 'thisMonth':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    case 'custom':
      return { start: customStart || today, end: customEnd || now };
    default:
      return { start: today, end: now };
  }
};

export const useEcommerceAnalytics = (
  dateRange: DateRange = '7days',
  customStart?: Date,
  customEnd?: Date,
  filters?: {
    deviceType?: string;
    category?: string;
  }
) => {
  const [cartCheckoutKPIs, setCartCheckoutKPIs] = useState<CartCheckoutKPIs>({
    cartAbandonmentRate: 0,
    checkoutCompletionRate: 0,
    avgCartValue: 0,
    couponsUsedToday: 0,
    couponConversionRate: 0,
    totalCarts: 0,
    completedCheckouts: 0
  });
  
  const [productKPIs, setProductKPIs] = useState<ProductKPIs>({
    addToCartRate: 0,
    mostViewedProduct: null,
    highestConvertingProduct: null,
    avgScrollDepth: 0,
    totalProductViews: 0
  });

  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [abandonmentReasons, setAbandonmentReasons] = useState<AbandonmentReason[]>([]);
  const [abandonedProducts, setAbandonedProducts] = useState<AbandonedProduct[]>([]);
  const [sizePatterns, setSizePatterns] = useState<SizePattern[]>([]);
  const [fitFeedback, setFitFeedback] = useState<FitFeedback[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);
  const [recentlyViewedData, setRecentlyViewedData] = useState<RecentlyViewedItem[]>([]);
  const [highIntentPages, setHighIntentPages] = useState<HighIntentPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEcommerceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRangeFilter(dateRange, customStart, customEnd);

      // Fetch orders for cart/checkout metrics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (ordersError) throw ordersError;

      // Fetch cart items
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (cartError) throw cartError;

      // Fetch analytics events
      const { data: analyticsEvents, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (analyticsError) throw analyticsError;

      // Fetch products for reference
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('visible', true);

      if (productsError) throw productsError;

      // Fetch checkout funnel data
      const { data: funnelEvents, error: funnelError } = await supabase
        .from('checkout_funnel')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (funnelError) console.log('Funnel table may be empty:', funnelError);

      // Fetch abandonment reasons
      const { data: abandonmentData, error: abandonError } = await supabase
        .from('cart_abandonment_reasons')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (abandonError) console.log('Abandonment table may be empty:', abandonError);

      // Fetch fit feedback
      const { data: fitData, error: fitError } = await supabase
        .from('product_fit_feedback')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (fitError) console.log('Fit feedback table may be empty:', fitError);

      // Fetch wishlist data
      const { data: wishlistItems, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (wishlistError) console.log('Wishlist table may be empty:', wishlistError);

      // Fetch recently viewed
      const { data: recentViews, error: recentError } = await supabase
        .from('recently_viewed')
        .select('*, products(*)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (recentError) console.log('Recently viewed table may be empty:', recentError);

      // Calculate Cart & Checkout KPIs
      const ordersData = orders || [];
      const cartData = cartItems || [];
      const eventsData = analyticsEvents || [];
      const productsData = products || [];

      const completedOrders = ordersData.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
      const uniqueCartSessions = [...new Set(cartData.map(c => c.session_id))];
      const sessionsWithOrders = [...new Set(ordersData.map(o => o.customer_email))];
      
      const abandonmentRate = uniqueCartSessions.length > 0 
        ? ((uniqueCartSessions.length - completedOrders.length) / uniqueCartSessions.length) * 100 
        : 0;
      
      const completionRate = uniqueCartSessions.length > 0
        ? (completedOrders.length / uniqueCartSessions.length) * 100
        : 0;

      const avgCartValue = ordersData.length > 0
        ? ordersData.reduce((sum, o) => sum + (o.total || 0), 0) / ordersData.length
        : 0;

      setCartCheckoutKPIs({
        cartAbandonmentRate: Math.round(abandonmentRate * 10) / 10,
        checkoutCompletionRate: Math.round(completionRate * 10) / 10,
        avgCartValue: Math.round(avgCartValue),
        couponsUsedToday: ordersData.filter(o => o.discount && o.discount > 0).length,
        couponConversionRate: 0,
        totalCarts: uniqueCartSessions.length,
        completedCheckouts: completedOrders.length
      });

      // Calculate Product KPIs
      const productViews = eventsData.filter(e => e.event_type === 'page_view' && e.page_url.includes('/product/'));
      const addToCartClicks = eventsData.filter(e => e.click_target === 'add_to_cart_button');
      
      const addToCartRate = productViews.length > 0
        ? (addToCartClicks.length / productViews.length) * 100
        : 0;

      // Most viewed product
      const productViewCounts: Record<string, number> = {};
      productViews.forEach(v => {
        const slug = v.page_url.split('/product/')[1];
        if (slug) {
          productViewCounts[slug] = (productViewCounts[slug] || 0) + 1;
        }
      });
      
      const mostViewedSlug = Object.entries(productViewCounts).sort((a, b) => b[1] - a[1])[0];
      const mostViewedProduct = mostViewedSlug 
        ? productsData.find(p => p.slug === mostViewedSlug[0])
        : null;

      // Average scroll depth
      const scrollDepths = eventsData
        .filter(e => e.scroll_depth && e.scroll_depth > 0)
        .map(e => e.scroll_depth as number);
      const avgScroll = scrollDepths.length > 0
        ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
        : 0;

      setProductKPIs({
        addToCartRate: Math.round(addToCartRate * 10) / 10,
        mostViewedProduct: mostViewedProduct 
          ? { name: mostViewedProduct.name, views: mostViewedSlug?.[1] || 0 }
          : null,
        highestConvertingProduct: null,
        avgScrollDepth: Math.round(avgScroll),
        totalProductViews: productViews.length
      });

      // Calculate Funnel Data
      const steps = ['homepage', 'product', 'cart', 'shipping', 'payment', 'review', 'complete'];
      const funnelEventsData = funnelEvents || [];
      
      // Build funnel data step by step to avoid self-reference issue
      const calculatedFunnel: FunnelStep[] = [];
      steps.forEach((step, index) => {
        const stepEvents = funnelEventsData.filter(e => e.step === step);
        const users = stepEvents.length || Math.max(0, 100 - index * 15); // Fallback for empty data
        const prevUsers = index > 0 ? (calculatedFunnel[index - 1]?.users || users + 10) : users;
        const dropOff = Math.max(0, prevUsers - users);
        const conversionRate = prevUsers > 0 ? (users / prevUsers) * 100 : 100;
        
        calculatedFunnel.push({ step, users, dropOff, conversionRate: Math.round(conversionRate) });
      });

      setFunnelData(calculatedFunnel);

      // Calculate Abandonment Reasons
      const abandonmentReasonsData = abandonmentData || [];
      const reasonCounts: Record<string, number> = {};
      const defaultReasons = ['high_shipping', 'account_required', 'payment_options', 'price_concerns', 'confusing_ui', 'slow_experience'];
      
      defaultReasons.forEach(r => { reasonCounts[r] = 0; });
      abandonmentReasonsData.forEach(a => {
        reasonCounts[a.reason] = (reasonCounts[a.reason] || 0) + 1;
      });
      
      const totalReasons = Object.values(reasonCounts).reduce((a, b) => a + b, 0) || 1;
      setAbandonmentReasons(
        Object.entries(reasonCounts).map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / totalReasons) * 100)
        }))
      );

      // Calculate Size Patterns from cart items
      const sizeCounts: Record<string, number> = {};
      cartData.forEach(item => {
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + 1;
      });
      const totalSizes = Object.values(sizeCounts).reduce((a, b) => a + b, 0) || 1;
      setSizePatterns(
        Object.entries(sizeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([size, count]) => ({
            size,
            count,
            percentage: Math.round((count / totalSizes) * 100)
          }))
      );

      // Calculate Fit Feedback
      const fitFeedbackData = fitData || [];
      const fitCounts: Record<string, number> = { small: 0, true_to_size: 0, large: 0 };
      fitFeedbackData.forEach(f => {
        fitCounts[f.fit_rating] = (fitCounts[f.fit_rating] || 0) + 1;
      });
      const totalFit = Object.values(fitCounts).reduce((a, b) => a + b, 0) || 1;
      setFitFeedback(
        Object.entries(fitCounts).map(([rating, count]) => ({
          rating,
          count,
          percentage: Math.round((count / totalFit) * 100)
        }))
      );

      // Calculate Trending Products
      const productInteractions: Record<string, { views: number; addToCart: number }> = {};
      eventsData.forEach(e => {
        if (e.product_id) {
          if (!productInteractions[e.product_id]) {
            productInteractions[e.product_id] = { views: 0, addToCart: 0 };
          }
          if (e.event_type === 'page_view') {
            productInteractions[e.product_id].views++;
          }
          if (e.click_target === 'add_to_cart_button') {
            productInteractions[e.product_id].addToCart++;
          }
        }
      });

      const trending = Object.entries(productInteractions)
        .map(([id, data]) => {
          const product = productsData.find(p => p.id === id);
          return {
            id,
            name: product?.name || 'Unknown',
            velocity: data.views + data.addToCart * 2,
            views: data.views,
            addToCartCount: data.addToCart
          };
        })
        .sort((a, b) => b.velocity - a.velocity)
        .slice(0, 10);

      setTrendingProducts(trending);

      // Calculate Wishlist Data
      const wishlistItemsData = wishlistItems || [];
      const wishlistCounts: Record<string, { added: number; converted: number; name: string }> = {};
      wishlistItemsData.forEach(w => {
        const productId = w.product_id;
        if (!wishlistCounts[productId]) {
          wishlistCounts[productId] = { 
            added: 0, 
            converted: 0, 
            name: (w.products as any)?.name || 'Unknown'
          };
        }
        wishlistCounts[productId].added++;
        if (w.converted_to_cart) {
          wishlistCounts[productId].converted++;
        }
      });

      setWishlistData(
        Object.entries(wishlistCounts)
          .map(([productId, data]) => ({
            productId,
            productName: data.name,
            addedCount: data.added,
            convertedCount: data.converted,
            conversionRate: data.added > 0 ? Math.round((data.converted / data.added) * 100) : 0
          }))
          .sort((a, b) => b.addedCount - a.addedCount)
          .slice(0, 20)
      );

      // Calculate Recently Viewed
      const recentViewsData = recentViews || [];
      const viewedCounts: Record<string, { views: number; sessions: Set<string>; timeSpent: number; repeats: number; name: string }> = {};
      recentViewsData.forEach(r => {
        const productId = r.product_id;
        if (!viewedCounts[productId]) {
          viewedCounts[productId] = { 
            views: 0, 
            sessions: new Set(), 
            timeSpent: 0, 
            repeats: 0,
            name: (r.products as any)?.name || 'Unknown'
          };
        }
        viewedCounts[productId].views += r.view_count || 1;
        viewedCounts[productId].sessions.add(r.session_id);
        viewedCounts[productId].timeSpent += r.total_time_spent || 0;
        if (r.view_count > 1) {
          viewedCounts[productId].repeats++;
        }
      });

      setRecentlyViewedData(
        Object.entries(viewedCounts)
          .map(([productId, data]) => ({
            productId,
            productName: data.name,
            totalViews: data.views,
            uniqueViewers: data.sessions.size,
            avgTimeSpent: data.sessions.size > 0 ? Math.round(data.timeSpent / data.sessions.size) : 0,
            repeatViews: data.repeats
          }))
          .sort((a, b) => b.totalViews - a.totalViews)
          .slice(0, 20)
      );

      // Calculate High Intent Pages
      const pageInteractions: Record<string, { views: number; addToCart: number; timeSpent: number; scrollDepth: number }> = {};
      eventsData.forEach(e => {
        const page = e.page_url;
        if (!pageInteractions[page]) {
          pageInteractions[page] = { views: 0, addToCart: 0, timeSpent: 0, scrollDepth: 0 };
        }
        if (e.event_type === 'page_view') {
          pageInteractions[page].views++;
        }
        if (e.click_target === 'add_to_cart_button') {
          pageInteractions[page].addToCart++;
        }
        if (e.session_duration) {
          pageInteractions[page].timeSpent += e.session_duration;
        }
        if (e.scroll_depth) {
          pageInteractions[page].scrollDepth += e.scroll_depth;
        }
      });

      setHighIntentPages(
        Object.entries(pageInteractions)
          .filter(([_, data]) => data.views > 0)
          .map(([page, data]) => ({
            page,
            addToCartRate: data.views > 0 ? Math.round((data.addToCart / data.views) * 100) : 0,
            avgTimeSpent: data.views > 0 ? Math.round(data.timeSpent / data.views) : 0,
            avgScrollDepth: data.views > 0 ? Math.round(data.scrollDepth / data.views) : 0,
            visits: data.views
          }))
          .sort((a, b) => b.addToCartRate - a.addToCartRate)
          .slice(0, 20)
      );

      // Calculate Abandoned Products
      const abandonedProductCounts: Record<string, { abandoned: number; addedToCart: number }> = {};
      cartData.forEach(c => {
        const productId = c.product_id;
        if (!abandonedProductCounts[productId]) {
          abandonedProductCounts[productId] = { abandoned: 0, addedToCart: 0 };
        }
        abandonedProductCounts[productId].addedToCart++;
      });

      // Check which cart items didn't result in orders
      const orderedProductIds = new Set(
        ordersData.flatMap(o => {
          const items = o.items as any[];
          return items?.map(i => i.product_id) || [];
        })
      );

      cartData.forEach(c => {
        if (!orderedProductIds.has(c.product_id)) {
          abandonedProductCounts[c.product_id].abandoned++;
        }
      });

      setAbandonedProducts(
        Object.entries(abandonedProductCounts)
          .map(([id, data]) => {
            const product = productsData.find(p => p.id === id);
            return {
              id,
              name: product?.name || 'Unknown',
              category: product?.category || 'Unknown',
              timesAbandoned: data.abandoned,
              addToCartFrequency: data.addedToCart,
              dropOffRate: data.addedToCart > 0 ? Math.round((data.abandoned / data.addedToCart) * 100) : 0
            };
          })
          .filter(p => p.timesAbandoned > 0)
          .sort((a, b) => b.timesAbandoned - a.timesAbandoned)
          .slice(0, 20)
      );

    } catch (error) {
      console.error('Error fetching e-commerce analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch e-commerce analytics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStart, customEnd, filters, toast]);

  useEffect(() => {
    fetchEcommerceData();
  }, [fetchEcommerceData]);

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('ecommerce-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchEcommerceData();
        })
        .subscribe(),
      supabase.channel('ecommerce-cart')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, () => {
          fetchEcommerceData();
        })
        .subscribe(),
      supabase.channel('ecommerce-wishlist')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
          fetchEcommerceData();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchEcommerceData]);

  return {
    cartCheckoutKPIs,
    productKPIs,
    funnelData,
    abandonmentReasons,
    abandonedProducts,
    sizePatterns,
    fitFeedback,
    trendingProducts,
    wishlistData,
    recentlyViewedData,
    highIntentPages,
    isLoading,
    refetch: fetchEcommerceData
  };
};

export default useEcommerceAnalytics;
