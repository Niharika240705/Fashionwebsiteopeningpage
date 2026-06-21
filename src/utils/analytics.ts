/**
 * Analytics utility for tracking user interactions
 * Replace with your actual analytics service (Google Analytics, Mixpanel, etc.)
 */

// Track external link clicks
export const trackExternalLink = (url: string, designer: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'click', {
      event_category: 'External Link',
      event_label: designer,
      link_url: url,
    });
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('External link clicked:', { url, designer });
  }
};

// Track outfit save
export const trackOutfitSave = (outfitId: number, designer: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'save', {
      event_category: 'Outfit',
      event_label: designer,
      outfit_id: outfitId,
    });
  }
  
  if (import.meta.env.DEV) {
    console.log('Outfit saved:', { outfitId, designer });
  }
};

// Track body type discovery
export const trackBodyTypeDiscovery = (bodyShape: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'body_type_discovery', {
      event_category: 'UFind',
      event_label: bodyShape,
    });
  }
  
  if (import.meta.env.DEV) {
    console.log('Body type discovered:', bodyShape);
  }
};

// Track page view
export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: pageName,
    });
  }
  
  if (import.meta.env.DEV) {
    console.log('Page view:', pageName);
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

