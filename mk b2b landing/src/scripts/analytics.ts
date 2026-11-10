/** Cookieless events (SPEC §12). Sends nothing unless PUBLIC_ANALYTICS_ENDPOINT is set; then add that origin to connect-src in public/_headers. */
const endpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT;
const domain = import.meta.env.PUBLIC_ANALYTICS_DOMAIN;

export function track(name: string) {
  if (!endpoint) return;
  const body = JSON.stringify({ name, url: location.href, domain, props: { locale: document.documentElement.lang } });
  navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain' }));
}
