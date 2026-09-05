export const DEFAULT_LOCAL_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
] as const;

export function corsOriginsFromEnv(value: string | undefined): string[] {
  const configured = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = configured?.length ? configured : DEFAULT_LOCAL_CORS_ORIGINS;
  return [...new Set(origins.map(normalizeOrigin))];
}

export function corsResponseHeaders(origin: string | undefined, allowedOrigins: readonly string[]) {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

function normalizeOrigin(value: string) {
  if (value === '*') {
    throw new Error('INFINITE_WORLD_CORS_ORIGINS must contain explicit origins');
  }
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported CORS origin protocol: ${url.protocol}`);
  }
  return url.origin;
}
