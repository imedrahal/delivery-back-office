import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeedDb } from '../../data/seed.js';
import { getDb, resetDb } from '../../data/mockDb.js';

vi.mock('../../config/runtime.js', () => ({
  DEFAULT_API_BASE_URL: 'http://localhost:3000/api/v1',
  USE_DEMO_BACKEND: true,
}));

import { createTransporter, listResource, setTransporterActive } from '../backOfficeApi.js';

beforeEach(() => {
  resetDb(createSeedDb(Date.UTC(2026, 0, 1)));
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Karya transporter demo backend', () => {
  it('lists seeded transporter mocks without calling the backend', async () => {
    const result = await listResource('transporters', { pageSize: 9 });

    expect(result.total).toBe(6);
    expect(result.items[0]).toMatchObject({
      name: expect.any(String),
      active: true,
      account_status: 'ACTIVE',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates transporter accounts in the mock store without calling the backend', async () => {
    const created = await createTransporter({
      name: 'Transport Démo',
      phone: '+21620123456',
      city: 'Tunis',
      vehicleType: 'Camion',
    });

    expect(getDb().transporters).toContainEqual(expect.objectContaining({
      id: created.id,
      name: 'Transport Démo',
      active: true,
      account_status: 'ACTIVE',
    }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('activates and hides transporter accounts in the mock store without calling the backend', async () => {
    const transporter = getDb().transporters.find((item) => item.active);
    const hidden = await setTransporterActive(transporter.id, false);

    expect(hidden).toMatchObject({ active: false });
    expect(getDb().transporters.find((item) => item.id === transporter.id).active).toBe(false);

    const activated = await setTransporterActive(transporter.id, true);
    expect(activated).toMatchObject({ active: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});
