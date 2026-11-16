import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeStatus, createTransporter, getDashboardStats, getDeliveryDetails, listResource, login, setTransporterActive } from '../backOfficeApi.js';

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
});

describe('admin user API', () => {
      const setAdminSession = () => {
        vi.stubGlobal('sessionStorage', {
          getItem: () => JSON.stringify({
            accessToken: 'admin-token',
            user: { role: 'admin' },
          }),
        });
      };

      it('lists customers from the paginated admin users endpoint', async () => {
        setAdminSession();
        const fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            items: [{
              id: 'customer-id',
              name: 'Client Example',
              email: 'client@example.com',
              phone: '+21620123456',
              role: 'customer',
              active: true,
              ratingAvg: 4.5,
              ratingCount: 2,
              createdAt: '2026-01-01T00:00:00.000Z',
            }],
          }),
        });
        vi.stubGlobal('fetch', fetch);

        await expect(listResource('users', {
          page: 1,
          pageSize: 8,
          filters: { roles: 'customer' },
        })).resolves.toMatchObject({
          total: 1,
          items: [{
            id: 'customer-id',
            display_name: 'Client Example',
            account_status: 'ACTIVE',
            rating: { average: 4.5, count: 2 },
          }],
        });
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/admin/users?role=customer&limit=100&offset=0',
          expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) }),
        );
      });

      it('maps provider vehicle details and account status for the courier directory', async () => {
        setAdminSession();
        const fetch = vi.fn(async (url) => ({
          ok: true,
          status: 200,
          json: async () => (url.includes('/admin/providers')
            ? { items: [{
                id: 'provider-id',
                name: 'Courier Example',
                email: 'courier@example.com',
                phone: '+21620123456',
                role: 'provider',
                active: false,
                approvalStatus: 'approved',
                ratingAvg: null,
                ratingCount: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
                provider: {
                  vehicleType: 'motorcycle',
                  vehiclePlate: '123 TU 456',
                  licenseNumber: 'LIC-1234',
                  licenseUploaded: true,
                  vehicleDescription: 'Scooter',
                },
                licensePhotoUrl: 'http://localhost:3000/uploads/license.jpg',
              }] }
            : { items: [{
                id: 'provider-id',
                name: 'Courier Example',
                email: 'courier@example.com',
                phone: '+21620123456',
                role: 'provider',
                active: false,
                approvalStatus: 'approved',
                ratingAvg: null,
                ratingCount: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
              }] }),
        }));
        vi.stubGlobal('fetch', fetch);

        await expect(listResource('users', {
          page: 1,
          pageSize: 8,
          filters: { roles: 'courier' },
        })).resolves.toMatchObject({
          items: [{
            id: 'provider-id',
            account_status: 'DEACTIVATED',
            capabilities: [{ capability: 'courier', status: 'APPROVED' }],
            courier_profile: {
              vehicle: 'MOTO',
              vehicle_plate: '123 TU 456',
              license_number: 'LIC-1234',
              license_photo_url: 'http://localhost:3000/uploads/license.jpg',
            },
          }],
        });
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      it('activates and deactivates accounts through the admin user endpoint', async () => {
        setAdminSession();
        const fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ id: 'user-id', active: false }),
        });
        vi.stubGlobal('fetch', fetch);

        await expect(changeStatus('account', 'user-id', { to: 'DEACTIVATED', reason: 'Requested by admin' }))
          .resolves.toEqual({ id: 'user-id', active: false, account_status: 'DEACTIVATED' });
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/admin/users/user-id',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ active: false }),
          }),
        );
      });
});

describe('courier rating API', () => {
  const setAdminSession = () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => JSON.stringify({
        accessToken: 'admin-token',
        user: { role: 'admin' },
      }),
    });
  };

  it('lists every provider and reads its rating from the admin users endpoint', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'rated-courier',
            name: 'Rated Courier',
            role: 'provider',
            active: true,
            approvalStatus: 'approved',
            ratingAvg: 4.7,
            ratingCount: 3,
            createdAt: '2026-01-02T00:00:00.000Z',
          },
          {
            id: 'unrated-courier',
            name: 'Unrated Courier',
            role: 'provider',
            active: true,
            approvalStatus: 'approved',
            ratingAvg: null,
            ratingCount: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(listResource('ratings', { pageSize: 8 })).resolves.toMatchObject({
      total: 2,
      items: [{
        id: 'rated-courier',
        provider_name: 'Rated Courier',
        score: 4.7,
        rating_count: 3,
      }, {
        id: 'unrated-courier',
        provider_name: 'Unrated Courier',
        score: null,
        rating_count: 0,
      }],
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/admin/users?role=provider&limit=100&offset=0',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) }),
    );
  });

  it('sends the search term to admin users while restricting results to providers', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal('fetch', fetch);

    await listResource('ratings', { search: 'Amine', pageSize: 8 });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/admin/users?role=provider&q=Amine&limit=100&offset=0',
      expect.any(Object),
    );
  });
});

describe('delivery API', () => {
  const setAdminSession = () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => JSON.stringify({
        accessToken: 'admin-token',
        user: { role: 'admin' },
      }),
    });
  };

  const delivery = (overrides = {}) => ({
    id: 'delivery-1',
    ref: 'LIV-001',
    status: 'requested',
    pickupAddress: 'Tunis',
    destinationAddress: 'Sfax',
    recipientName: 'Recipient Example',
    recipientPhone: '+21620123456',
    parcelDescription: 'Documents',
    customer: { id: 'customer-1', name: 'Samira Client', phone: '+21620111111' },
    courier: null,
    preferredCourier: { id: 'courier-1', name: 'Courier Example' },
    exclusiveUntil: '2099-01-01T00:00:00.000Z',
    codAmount: 20,
    courierFee: 5,
    netToSender: 15,
    deliveredAt: null,
    settledAt: null,
    failureReason: null,
    rated: false,
    hasReturn: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  });

  it('maps API fields/statuses and applies local search while relaying the status filter', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [delivery()] }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(listResource('deliveries', {
      search: 'Samira',
      page: 1,
      pageSize: 8,
      filters: { status: 'OPEN_FOR_PREFERRED_COURIER' },
    })).resolves.toMatchObject({
      total: 1,
      items: [{
        id: 'delivery-1',
        reference: 'LIV-001',
        status: 'OPEN_FOR_PREFERRED_COURIER',
        customer_name: 'Samira Client',
        courier_name: null,
        pickup_address: 'Tunis',
        destination_address: 'Sfax',
        cod_amount: 20,
        courier_fee: 5,
      }],
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/deliveries?status=requested&limit=100&offset=0',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) }),
    );
  });

  it('loads delivery details and maps API history events for the timeline', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...delivery({
          status: 'picked_up',
          history: [
            { status: 'requested', note: 'Created by customer', at: '2026-01-01T00:00:00.000Z' },
            { status: 'picked_up', note: 'Parcel collected', at: '2026-01-02T00:00:00.000Z' },
          ],
        }),
      }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(getDeliveryDetails('delivery-1')).resolves.toMatchObject({
      id: 'delivery-1',
      status: 'PICKED_UP',
      events: [
        { to_status: 'OPEN_FOR_COURIERS', reason: 'Created by customer' },
        { to_status: 'PICKED_UP', reason: 'Parcel collected' },
      ],
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/deliveries/delivery-1',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) }),
    );
  });
});

describe('Karya transporter API', () => {
  const setAdminSession = () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => JSON.stringify({
        accessToken: 'admin-token',
        user: { role: 'admin' },
      }),
    });
  };

  it('lists transporter profiles and maps visibility to account status', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { id: 'transporter-1', name: 'Transport Example', phone: '+21620123456', city: 'Tunis', vehicleType: 'Truck', active: true },
          { id: 'transporter-2', name: 'Transport Hidden', phone: '+21620987654', city: 'Sfax', vehicleType: 'Van', active: false },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(listResource('transporters', { pageSize: 9 })).resolves.toMatchObject({
      total: 2,
      items: [
        { id: 'transporter-1', active: true, account_status: 'ACTIVE' },
        { id: 'transporter-2', active: false, account_status: 'DEACTIVATED' },
      ],
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/admin/transporters',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) }),
    );
  });

  it('only toggles transporter account visibility through the admin endpoint', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'transporter-1', active: false }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(setTransporterActive('transporter-1', false)).resolves.toMatchObject({
      id: 'transporter-1',
      active: false,
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/admin/transporters/transporter-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      }),
    );
  });

  it('creates a transporter with the backend fields and activates the new account', async () => {
    setAdminSession();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'transporter-new',
        name: 'Transport Nouveau',
        phone: '+21620123456',
        city: 'Tunis',
        vehicleType: 'Camion',
        vehicleDescription: null,
        capacity: '3 tonnes',
        description: null,
        active: true,
      }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(createTransporter({
      name: ' Transport Nouveau ',
      phone: ' +216 20 123 456 ',
      city: ' Tunis ',
      vehicleType: ' Camion ',
      capacity: ' 3 tonnes ',
    })).resolves.toMatchObject({
      id: 'transporter-new',
      active: true,
      account_status: 'ACTIVE',
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/admin/transporters',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Transport Nouveau',
          phone: '+216 20 123 456',
          city: 'Tunis',
          vehicleType: 'Camion',
          vehicleDescription: null,
          capacity: '3 tonnes',
          description: null,
          active: true,
        }),
      }),
    );
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
