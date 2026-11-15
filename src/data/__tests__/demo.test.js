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
});
