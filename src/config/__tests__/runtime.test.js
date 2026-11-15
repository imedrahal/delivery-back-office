import { describe, expect, it } from 'vitest';
import { isLoopbackApiUrl, shouldUseDemoBackend } from '../runtime.js';

describe('demo backend selection', () => {
  it('recognizes IPv4, IPv6 and localhost API URLs', () => {
    expect(isLoopbackApiUrl('http://localhost:3000/api/v1')).toBe(true);
    expect(isLoopbackApiUrl('http://127.0.0.1:3000/api/v1')).toBe(true);
    expect(isLoopbackApiUrl('http://[::1]:3000/api/v1')).toBe(true);
    expect(isLoopbackApiUrl('https://api.example.com/api/v1')).toBe(false);
    expect(isLoopbackApiUrl('not-a-url')).toBe(false);
  });

  it('uses demo data only for production Vercel deployments with a loopback API', () => {
    const config = {
      isProduction: true,
      hostname: 'delivery-demo.vercel.app',
      deploymentPlatform: undefined,
      apiBaseUrl: 'http://localhost:3000/api/v1',
    };
    expect(shouldUseDemoBackend(config)).toBe(true);
    expect(shouldUseDemoBackend({ ...config, isProduction: false })).toBe(false);
    expect(shouldUseDemoBackend({ ...config, hostname: 'localhost' })).toBe(false);
    expect(shouldUseDemoBackend({ ...config, apiBaseUrl: 'https://api.example.com/api/v1' })).toBe(false);
    expect(shouldUseDemoBackend({ ...config, hostname: 'backoffice.example.com', deploymentPlatform: 'vercel' })).toBe(true);
  });
});
