const configuredApiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

function getApiOrigin() {
  if (configuredApiOrigin) return configuredApiOrigin;
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:4000';
  }
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:4000';
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function apiUrl(path: string) {
  const origin = getApiOrigin();
  return origin ? `${origin}${path}` : path;
}

export function websocketUrl(path: string) {
  const origin = getApiOrigin() || window.location.origin;
  const url = new URL(path, origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
