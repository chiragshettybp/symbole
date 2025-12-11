import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

export const useAnalyticsTracking = () => {
  const location = useLocation();
  const sessionStart = useRef<number>(Date.now());
  const lastScrollDepth = useRef<number>(0);
  const pageViewTracked = useRef<string>('');

  const trackEvent = useCallback(async (
    eventType: string,
    additionalData: Record<string, any> = {}
  ) => {
    try {
      const sessionId = getSessionId();
      
      await supabase.from('analytics_events').insert({
        session_id: sessionId,
        event_type: eventType,
        page_url: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        scroll_depth: lastScrollDepth.current,
        session_duration: Math.floor((Date.now() - sessionStart.current) / 1000),
        ...additionalData
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  const trackClick = useCallback((target: string, productId?: string) => {
    trackEvent('click', {
      click_target: target,
      product_id: productId || null
    });
  }, [trackEvent]);

  const trackScroll = useCallback((depth: number) => {
    if (depth > lastScrollDepth.current) {
      lastScrollDepth.current = depth;
    }
  }, []);

  // Track page views
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (pageViewTracked.current !== currentPath) {
      pageViewTracked.current = currentPath;
      lastScrollDepth.current = 0;
      
      trackEvent('page_view');
    }
  }, [location.pathname, trackEvent]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      trackScroll(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScroll]);

  // Track session end on page unload
  useEffect(() => {
    const handleUnload = () => {
      trackEvent('session_end', {
        scroll_depth: lastScrollDepth.current
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [trackEvent]);

  // Track session start
  useEffect(() => {
    const existingSession = sessionStorage.getItem('analytics_session_started');
    if (!existingSession) {
      sessionStorage.setItem('analytics_session_started', 'true');
      trackEvent('session_start');
    }
  }, [trackEvent]);

  return { trackEvent, trackClick, trackScroll };
};

export default useAnalyticsTracking;
