import { describe, expect, it } from 'vitest';
import { buildCourierUser, courierStats, EMPTY_COURIER, hasErrors, initials, isEmailTaken, validateCourier } from '../couriers.js';
import { createSeedDb } from '../../data/seed.js';

const valid = { display_name: ' Karim Bouzid ', phone: '+216 20 123 456', email: 'Karim@Example.tn', vehicle: 'MOTO', zone: 'Tunis' };

describe('couriers', () => {
  it('flags every missing field on an empty form', () => {
    expect(Object.keys(validateCourier(EMPTY_COURIER)).sort()).toEqual(['display_name', 'email', 'phone', 'zone']);
  });
  it('accepts a valid input', () => expect(hasErrors(validateCourier(valid))).toBe(false));
  it('builds an approved courier account without side effects', () => {
    const user = buildCourierUser(valid, { id: 'u-900', now: '2026-01-01T00:00:00Z' });
    expect(user).toMatchObject({ id: 'u-900', display_name: 'Karim Bouzid', email: 'karim@example.tn', roles: ['customer', 'courier'] });
    expect(user.capabilities).toEqual([{ capability: 'courier', status: 'APPROVED' }]);
  });
  it('detects duplicate e-mails case-insensitively', () => {
    const { users } = createSeedDb();
    expect(isEmailTaken(users, users[0].email.toUpperCase())).toBe(true);
    expect(isEmailTaken(users, 'nobody@nowhere.tn')).toBe(false);
  });
  it('counts couriers by status', () => {
    const stats = courierStats(createSeedDb().users);
    expect(stats.total).toBe(stats.approved + stats.pending + stats.suspended);
  });
  it('builds initials', () => expect(initials('karim bouzid ben')).toBe('KB'));
});
