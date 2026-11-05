import { CLOSED_RETURN_STATUSES, OPEN_DELIVERY_STATUSES, OPEN_DISPUTE_STATUSES } from './constants.js';

const count = (items, predicate) => items.filter(predicate).length;

export function computeDashboardStats({ deliveries, returns, karya, disputes }) {
  return {
    openDeliveries: count(deliveries, (d) => OPEN_DELIVERY_STATUSES.includes(d.status)),
    activeDeliveries: count(deliveries, (d) => ['ASSIGNED', 'PICKED_UP'].includes(d.status)),
    openReturns: count(returns, (r) => !CLOSED_RETURN_STATUSES.includes(r.status)),
    openKarya: count(karya, (k) => k.status === 'OPEN_FOR_QUOTES'),
    openDisputes: count(disputes, (d) => OPEN_DISPUTE_STATUSES.includes(d.status)),
  };
}
