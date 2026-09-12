const measurementId = (((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GA_MEASUREMENT_ID) || '').trim();

let initialized = false;

export function initAnalytics(): void {
  if (initialized || !measurementId || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.rrAnalytics = 'ga4';
  document.head.appendChild(script);
}

export function trackPageView(path: string, title: string): void {
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean> = {}): void {
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, parameters);
}

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}
