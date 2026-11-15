import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDashboardStats, login } from '../backOfficeApi.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login', () => {
  it('authenticates against the Livra API and returns its token session', async () => {
    const payload = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      user: { id: 'admin-id', name: 'Admin', email: 'admin@livra.local', role: 'admin' },
    };
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload });
    vi.stubGlobal('fetch', fetch);

    const session = await login(' admin@livra.local ', 'password');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'admin@livra.local', password: 'password' }),
      }),
    );
    expect(session).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'admin-id', display_name: 'Admin', role: 'admin' },
    });
  });

  describe('getDashboardStats', () => {
    it('counts dashboard records from the admin APIs, including paginated lists', async () => {
      const records = {
        '/deliveries:requested': Array.from({ length: 101 }, (_, index) => ({ id: `open-${index}` })),
        '/deliveries:accepted': [{ id: 'accepted-1' }, { id: 'accepted-2' }],
        '/deliveries:picked_up': [{ id: 'picked-up-1' }],
        '/returns:requested': [{ id: 'requested-return' }],
        '/returns:accepted': [{ id: 'accepted-return-1' }, { id: 'accepted-return-2' }],
        '/returns:picked_up': [{ id: 'picked-up-return' }],
        '/disputes:open': [{ id: 'dispute-1' }, { id: 'dispute-2' }],
      };
      const fetch = vi.fn(async (url, options) => {
        const requestUrl = new URL(url);
        let payload;
        if (requestUrl.pathname.endsWith('/admin/transporters')) {
          payload = { items: [{ active: true }, { active: false }, { active: true }, { active: false }] };
        } else {
          const status = requestUrl.searchParams.get('status');
          const resource = requestUrl.pathname.split('/').pop();
          const items = records[`/${resource}:${status}`];
          const offset = Number(requestUrl.searchParams.get('offset'));
          const limit = Number(requestUrl.searchParams.get('limit'));
          payload = { items: items.slice(offset, offset + limit) };
        }

        expect(options.headers.Authorization).toBe('Bearer dashboard-token');
        return { ok: true, status: 200, json: async () => payload };
      });
      vi.stubGlobal('fetch', fetch);
      vi.stubGlobal('sessionStorage', {
        getItem: () => JSON.stringify({
          accessToken: 'dashboard-token',
          user: { role: 'admin' },
        }),
      });

      await expect(getDashboardStats()).resolves.toEqual({
        openDeliveries: 101,
        activeDeliveries: 3,
        openReturns: 4,
        activeTransporters: 2,
        inactiveTransporters: 2,
        openDisputes: 2,
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deliveries?status=requested&limit=100&offset=100'),
        expect.any(Object),
      );
    });

    it('does not return mock values when the admin session is missing', async () => {
      vi.stubGlobal('sessionStorage', { getItem: () => null });
      await expect(getDashboardStats()).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
    });
  });

  it('converts API authentication failures to ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'INVALID_CREDENTIALS' }),
    }));

    await expect(login('invalid@example.com', 'wrong')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  it('rejects successful authentication for non-admin accounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-id', name: 'User', role: 'customer' },
      }),
    }));

    await expect(login('user@example.com', 'password')).rejects.toMatchObject({
      code: 'ADMIN_REQUIRED',
      status: 403,
    });
  });
});
