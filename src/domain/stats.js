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

const ACTIVITY_SOURCES = [
  ['deliveries', 'DELIVERY'], ['returns', 'RETURN'], ['karya', 'KARYA'], ['disputes', 'DISPUTE'],
];

/** Latest status events across all job collections, newest first. */
export function recentActivity(db, limit = 8) {
  return ACTIVITY_SOURCES
    .flatMap(([collection, type]) => db[collection].flatMap((item) => (item.events ?? []).map((event) => ({
      id: `${item.id}:${event.id}`, type, reference: item.reference, status: event.to_status,
      actor_name: event.actor_name, created_at: event.created_at,
    }))))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}
