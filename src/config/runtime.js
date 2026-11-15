export const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

export function isLoopbackApiUrl(apiBaseUrl) {
  try {
    const hostname = new URL(apiBaseUrl).hostname.replace(/^\[|\]$/g, '');
    return ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

export function shouldUseDemoBackend({ isProduction, hostname, deploymentPlatform, apiBaseUrl }) {
  const isVercel = deploymentPlatform === 'vercel' || hostname?.endsWith('.vercel.app');
  return Boolean(isProduction && isVercel && isLoopbackApiUrl(apiBaseUrl));
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const USE_DEMO_BACKEND = shouldUseDemoBackend({
  isProduction: import.meta.env.PROD,
  hostname: typeof window === 'undefined' ? '' : window.location.hostname,
  deploymentPlatform: import.meta.env.VITE_DEPLOYMENT_PLATFORM,
  apiBaseUrl,
});
