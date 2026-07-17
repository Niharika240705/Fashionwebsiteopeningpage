/**
 * Analytics utility for tracking user interactions
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
  }

  if (import.meta.env.DEV) {
    console.log('Analytics event:', name, params);
  }
};

export const trackExternalLink = (url: string, designer: string) => {
  trackEvent('affiliate_click', {
    event_category: 'External Link',
    event_label: designer,
    link_url: url,
  });
};

export const trackOutfitSave = (outfitId: number | string, designer: string) => {
  trackEvent('product_saved', {
    event_category: 'Outfit',
    event_label: designer,
    outfit_id: outfitId,
  });
};

export const trackBodyTypeDiscovery = (bodyShape: string) => {
  trackEvent('ufind_completed', {
    event_category: 'UFind',
    event_label: bodyShape,
  });
};

export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
      page_path: pageName,
    });
  }

  if (import.meta.env.DEV) {
    console.log('Page view:', pageName);
  }
};
