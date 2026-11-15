import { describe, expect, it } from 'vitest';
import { createSeedDb } from '../seed.js';
import { authenticateDemo, getDemoDashboardStats } from '../demo.js';

describe('demo data', () => {
  it('authenticates only with the published demo credentials', () => {
    expect(authenticateDemo(' DEMO@LIVRA.LOCAL ', 'Demo123!')).toMatchObject({
      isDemoSession: true,
      user: { role: 'admin', id: 'demo-admin' },
    });
    expect(() => authenticateDemo('demo@livra.local', 'wrong')).toThrowError(
      expect.objectContaining({ code: 'INVALID_CREDENTIALS' }),
    );
  });

  it('provides dashboard metrics derived from the seeded demo database', () => {
    expect(getDemoDashboardStats(createSeedDb(Date.UTC(2026, 0, 1)))).toEqual({
      openDeliveries: 10,
      activeDeliveries: 8,
      openReturns: 8,
      activeTransporters: 2,
      inactiveTransporters: 2,
      openDisputes: 4,
    });
  });

  it('seeds delivery fields and courier profiles used by the current pages', () => {
    const { users, deliveries } = createSeedDb(Date.UTC(2026, 0, 1));
    const courier = users.find((user) => user.capabilities.some((capability) => capability.capability === 'courier'));
    const delivery = deliveries[0];
    const delivered = deliveries.find((item) => item.status === 'DELIVERED');

    expect(courier.courier_profile).toMatchObject({
      vehicle: expect.any(String),
      zone: expect.any(String),
      vehicle_plate: expect.any(String),
      license_number: expect.any(String),
      license_uploaded: true,
    });
    expect(delivery).toMatchObject({
      reference: expect.any(String),
      customer_name: expect.any(String),
      pickup_address: expect.any(String),
      destination_address: expect.any(String),
      recipient_name: expect.any(String),
      recipient_phone: expect.any(String),
      parcel_description: expect.any(String),
      cod_amount: expect.any(Number),
      courier_fee: expect.any(Number),
      created_at: expect.any(String),
      events: expect.any(Array),
    });
    expect(delivery).not.toHaveProperty('pickup_confirmed_at');
    expect(delivered).toMatchObject({
      delivered_at: expect.any(String),
      settled_at: expect.any(String),
    });
  });
});
