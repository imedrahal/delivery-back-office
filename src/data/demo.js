import { courierStats } from '../domain/couriers.js';
import { ApiError } from '../domain/errors.js';
import { computeDashboardStats } from '../domain/stats.js';

export const DEMO_CREDENTIALS = {
  identifier: 'demo@livra.local',
  password: 'Demo123!',
};

export function authenticateDemo(identifier, password) {
  if (
    identifier.trim().toLowerCase() !== DEMO_CREDENTIALS.identifier
    || password !== DEMO_CREDENTIALS.password
  ) {
    throw new ApiError('INVALID_CREDENTIALS', 401);
  }

  return {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    isDemoSession: true,
    user: {
      id: 'demo-admin',
      name: 'Demo Administrator',
      display_name: 'Demo Administrator',
      role: 'admin',
    },
  };
}

export function getDemoDashboardStats(db) {
  const stats = computeDashboardStats(db);
  const couriers = courierStats(db.users);
  return {
    openDeliveries: stats.openDeliveries,
    activeDeliveries: stats.activeDeliveries,
    openReturns: stats.openReturns,
    activeTransporters: couriers.approved,
    inactiveTransporters: couriers.total - couriers.approved,
    openDisputes: stats.openDisputes,
  };
}
