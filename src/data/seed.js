// Deterministic static mock data (shaped like the spec's PostgreSQL entities).
// Replace the services layer with a real API client and this file can be deleted.
import {
  DISPUTE_CATEGORIES, DISPUTE_STATUSES, DELIVERY_STATUSES, KARYA_CATEGORIES, KARYA_STATUSES, LOCALES,
} from '../domain/constants.js';

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString();
const at = (list, i) => list[i % list.length];
const pad = (n) => String(n).padStart(3, '0');
const pathUntil = (flow, status) => flow.slice(0, flow.indexOf(status) + 1);

const NAMES = [
  'Amine Ben Salah', 'Salma Trabelsi', 'Yassine Gharbi', 'Mariem Jlassi', 'Walid Mansouri', 'Ines Chaabane',
  'Karim Haddad', 'Rania Bouazizi', 'Sami Hamdi', 'Nour Khelifi', 'Oussama Dridi', 'Lina Mejri',
];
const ADDRESSES = [
  '12 Rue de Marseille, Tunis', 'Avenue Habib Bourguiba 45, Tunis', 'Lac 2, Résidence Yasmine, Tunis',
  'La Marsa, Rue du Lac 7', 'Ariana Centre, Rue Farhat Hached', 'Sousse, Boulevard 14 Janvier',
  'Sfax, Avenue Hédi Chaker', "Ben Arous, Rue de l'Indépendance", 'Manouba, Rue de la Liberté', 'Le Bardo, Avenue 20 Mars',
];
const PARCELS = ['Documents in a sealed envelope', 'Small box of electronics', 'Clothing bag', 'Fragile ceramics', 'Pharmacy order', 'Birthday gift'];
const COMMENTS = ['Fast and polite.', 'Parcel arrived a bit late.', 'Package was damaged.', 'Great communication.', 'Okay overall.', 'Never again.'];
const DISPUTE_TEXTS = [
  'The parcel arrived with a broken corner.', 'The provider never showed up at the agreed time.',
  'The amount asked on site differs from the quote.', 'The courier was rude on the phone.', 'The address given by the recipient was wrong.',
];

function buildEvents(path, startMs, actorName = 'System') {
  return path.map((to, i) => ({
    id: `ev-${i + 1}`, actor_name: actorName, event_type: 'STATUS_CHANGE',
    from_status: i ? path[i - 1] : null, to_status: to, reason: null, created_at: iso(startMs + i * 15 * MIN),
  }));
}

function buildUsers(now) {
  return NAMES.map((name, i) => {
    const courier = i % 3 === 1 ? at(['APPROVED', 'APPROVED', 'PENDING', 'SUSPENDED'], Math.floor(i / 3)) : null;
    const karya = i % 3 === 2 || i === 7 ? at(['APPROVED', 'PENDING', 'APPROVED'], Math.floor(i / 3)) : null;
    const capabilities = [
      courier && { capability: 'courier', status: courier },
      karya && { capability: 'karya', status: karya },
    ].filter(Boolean);
    const created = iso(now - (60 - i) * DAY);
    return {
      id: `u-${pad(i + 1)}`, display_name: name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.tn`,
      phone: `+216 ${20 + i} ${100 + i * 7} ${300 + i * 11}`,
      preferred_language: at(LOCALES, i),
      account_status: i === 10 ? 'DEACTIVATED' : 'ACTIVE',
      roles: ['customer', ...(courier ? ['courier'] : []), ...(karya ? ['karya'] : [])],
      capabilities, created_at: created, updated_at: created, events: [],
    };
  });
}

const DELIVERY_FLOW = ['OPEN_FOR_COURIERS', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];
function deliveryPath(status) {
  if (status === 'OPEN_FOR_PREFERRED_COURIER') return [status];
  if (status === 'CANCELLED') return ['OPEN_FOR_COURIERS', 'CANCELLED'];
  if (status === 'FAILED') return [...pathUntil(DELIVERY_FLOW, 'PICKED_UP'), 'FAILED'];
  return pathUntil(DELIVERY_FLOW, status);
}

function buildDeliveries(now, nameOf, customers, couriers) {
  return Array.from({ length: 30 }, (_, i) => {
    const status = at(DELIVERY_STATUSES, i);
    const customer = at(customers, i);
    const courier = at(couriers, i);
    const assigned = ['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED'].includes(status);
    const pickedUp = ['PICKED_UP', 'DELIVERED', 'FAILED'].includes(status);
    const preferred = status === 'OPEN_FOR_PREFERRED_COURIER' || i % 5 === 0 ? courier : null;
    const created = now - (30 - i) * 5 * HOUR;
    return {
      id: `dlv-${pad(i + 1)}`, reference: `DLV-${1001 + i}`, status,
      customer_id: customer, customer_name: nameOf(customer),
      assigned_courier_id: assigned ? courier : null, courier_name: assigned ? nameOf(courier) : null,
      preferred_courier_id: preferred, preferred_courier_name: nameOf(preferred),
      preferred_offer_expires_at: status === 'OPEN_FOR_PREFERRED_COURIER' ? iso(now + ((i % 9) + 1) * MIN) : null,
      pickup_address: at(ADDRESSES, i), destination_address: at(ADDRESSES, i + 3),
      recipient_name: at(NAMES, i + 5), recipient_phone: `+216 9${i % 10} 55${pad(i)}`.slice(0, 16),
      parcel_description: at(PARCELS, i), notes: i % 4 === 0 ? 'Call before arriving.' : '',
      pickup_confirmed_at: pickedUp ? iso(created + 40 * MIN) : null,
      failure_reason: status === 'FAILED' ? at(['RECIPIENT_UNAVAILABLE', 'ADDRESS_ISSUE', 'PARCEL_ISSUE'], i) : null,
      events: buildEvents(deliveryPath(status), created, 'System'),
      created_at: iso(created), updated_at: iso(created + HOUR),
    };
  });
}

const RETURN_FLOW = ['OPEN_FOR_COURIERS', 'ASSIGNED', 'RETURN_PICKED_UP', 'RETURNED'];
function returnPath(post, status) {
  const head = post ? ['RETURN_REQUESTED'] : [];
  if (['RETURN_REQUESTED', 'REJECTED'].includes(status)) return status === 'REJECTED' ? [...head, status] : head;
  const approved = post ? [...head, 'APPROVED'] : [];
  if (status === 'APPROVED') return approved;
  if (status === 'CANCELLED') return [...approved, 'OPEN_FOR_COURIERS', 'CANCELLED'];
  if (status === 'OPEN_FOR_PREFERRED_COURIER') return [...approved, status];
  return [...approved, ...pathUntil(RETURN_FLOW, status)];
}

function buildReturns(now, nameOf, deliveries, couriers) {
  const delivered = deliveries.filter((d) => d.status === 'DELIVERED');
  const failed = deliveries.filter((d) => d.status === 'FAILED');
  const postStatuses = ['RETURN_REQUESTED', 'APPROVED', 'REJECTED', 'OPEN_FOR_COURIERS', 'ASSIGNED', 'RETURNED'];
  const failedStatuses = ['OPEN_FOR_PREFERRED_COURIER', 'OPEN_FOR_COURIERS', 'ASSIGNED', 'RETURN_PICKED_UP', 'RETURNED', 'CANCELLED'];
  return Array.from({ length: 12 }, (_, k) => {
    const post = k % 2 === 0;
    const status = post ? at(postStatuses, k / 2) : at(failedStatuses, (k - 1) / 2);
    const original = post ? at(delivered, k / 2) : at(failed, (k - 1) / 2);
    const courier = ['ASSIGNED', 'RETURN_PICKED_UP', 'RETURNED'].includes(status) ? at(couriers, k) : null;
    const created = now - (12 - k) * 7 * HOUR;
    return {
      id: `ret-${pad(k + 1)}`, reference: `RET-${3001 + k}`, status,
      return_type: post ? 'POST_DELIVERY' : 'FAILED_DELIVERY',
      original_delivery_id: original.id, original_delivery_ref: original.reference,
      customer_id: original.customer_id, customer_name: original.customer_name,
      assigned_courier_id: courier, courier_name: nameOf(courier),
      reason: post ? at(['DAMAGED', 'WRONG_ITEM', 'CHANGED_MIND'], k) : original.failure_reason,
      pickup_address: post ? original.destination_address : original.pickup_address,
      return_destination: original.pickup_address,
      notes: '', events: buildEvents(returnPath(post, status), created, post ? original.customer_name : original.courier_name ?? 'System'),
      created_at: iso(created), updated_at: iso(created + HOUR),
    };
  });
}

const KARYA_FLOW = ['OPEN_FOR_QUOTES', 'PROVIDER_SELECTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
function buildKarya(now, nameOf, customers, providers) {
  return Array.from({ length: 12 }, (_, i) => {
    const status = at(KARYA_STATUSES, i);
    const selectedFlow = !['OPEN_FOR_QUOTES', 'CANCELLED'].includes(status);
    const created = now - (12 - i) * 9 * HOUR;
    const id = `kry-${pad(i + 1)}`;
    const quotes = [0, 1, 2].map((j) => ({
      id: `${id}-q${j + 1}`, provider_id: at(providers, i + j), provider_name: nameOf(at(providers, i + j)),
      amount: 180 + i * 15 + j * 40, currency: 'TND', note: j === 0 ? 'Available this week.' : '',
      status: selectedFlow ? (j === 0 ? 'SELECTED' : 'NOT_SELECTED') : j === 2 ? 'WITHDRAWN' : 'SUBMITTED',
      created_at: iso(created + (j + 1) * HOUR),
    }));
    const path = status === 'CANCELLED' ? ['OPEN_FOR_QUOTES', 'CANCELLED'] : pathUntil(KARYA_FLOW, status);
    const customer = at(customers, i);
    return {
      id, reference: `KRY-${2001 + i}`, status, category: at(KARYA_CATEGORIES, i),
      customer_id: customer, customer_name: nameOf(customer),
      pickup_address: at(ADDRESSES, i), destination_address: at(ADDRESSES, i + 4),
      description: at(['Three-seat sofa and a wardrobe', 'Pallet of tiles, 40 boxes', 'Studio apartment, about 25 boxes', 'Two washing machines'], i),
      pickup_floor: `${(i % 5) + 1}${i % 2 ? ' (elevator)' : ''}`,
      selected_quote_id: selectedFlow ? quotes[0].id : null,
      provider_id: selectedFlow ? quotes[0].provider_id : null, provider_name: selectedFlow ? quotes[0].provider_name : null,
      quotes, events: buildEvents(path, created, customer ? nameOf(customer) : 'System'),
      created_at: iso(created), updated_at: iso(created + HOUR),
    };
  });
}

function buildRatings(now, deliveries, karya) {
  const jobs = [
    ...deliveries.filter((d) => d.status === 'DELIVERED').map((d) => ({ type: 'DELIVERY', job: d, provider: [d.assigned_courier_id, d.courier_name] })),
    ...karya.filter((k) => k.status === 'COMPLETED').map((k) => ({ type: 'KARYA', job: k, provider: [k.provider_id, k.provider_name] })),
  ];
  return jobs.map(({ type, job, provider }, i) => ({
    id: `rt-${pad(i + 1)}`, job_type: type, job_id: job.id, job_ref: job.reference,
    customer_id: job.customer_id, customer_name: job.customer_name,
    provider_id: provider[0], provider_name: provider[1],
    score: at([5, 4, 2, 5, 3, 1], i), comment: at(COMMENTS, i),
    moderation_status: i % 5 === 4 ? 'HIDDEN' : 'VISIBLE', events: [],
    created_at: iso(now - (jobs.length - i) * 11 * HOUR), updated_at: iso(now - (jobs.length - i) * 11 * HOUR),
  }));
}

const DISPUTE_FLOW = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];
function disputePath(status) {
  return status === 'REJECTED' ? ['OPEN', 'UNDER_REVIEW', 'REJECTED'] : pathUntil(DISPUTE_FLOW, status);
}

function buildDisputes(now, deliveries, returns, karya) {
  const jobs = [
    ...deliveries.filter((d) => d.assigned_courier_id).slice(0, 5).map((job) => ({ type: 'DELIVERY', job })),
    ...returns.slice(0, 2).map((job) => ({ type: 'RETURN', job })),
    ...karya.slice(1, 4).map((job) => ({ type: 'KARYA', job })),
  ];
  return jobs.map(({ type, job }, i) => {
    const status = at(DISPUTE_STATUSES, i);
    const decided = ['RESOLVED', 'REJECTED', 'CLOSED'].includes(status);
    const created = now - (jobs.length - i) * 13 * HOUR;
    return {
      id: `dsp-${pad(i + 1)}`, reference: `DSP-${4001 + i}`, status,
      job_type: type, job_id: job.id, job_ref: job.reference,
      opened_by: job.customer_id, opened_by_name: job.customer_name,
      category: at(DISPUTE_CATEGORIES, i), description: at(DISPUTE_TEXTS, i),
      decision_note: decided ? 'Reviewed evidence with both parties.' : null, decision_is_internal: false,
      events: buildEvents(disputePath(status), created, job.customer_name),
      created_at: iso(created), updated_at: iso(created + HOUR),
    };
  });
}

export function createSeedDb(now = Date.now()) {
  const users = buildUsers(now);
  const nameOf = (id) => users.find((u) => u.id === id)?.display_name ?? null;
  const customers = users.filter((_, i) => i % 3 === 0).map((u) => u.id);
  const couriers = users.filter((u) => u.capabilities.some((c) => c.capability === 'courier' && c.status === 'APPROVED')).map((u) => u.id);
  const karyaProviders = users.filter((u) => u.capabilities.some((c) => c.capability === 'karya' && c.status === 'APPROVED')).map((u) => u.id);
  const deliveries = buildDeliveries(now, nameOf, customers, couriers);
  const returns = buildReturns(now, nameOf, deliveries, couriers);
  const karya = buildKarya(now, nameOf, customers, karyaProviders);
  const ratings = buildRatings(now, deliveries, karya);
  const disputes = buildDisputes(now, deliveries, returns, karya);
  return { users, deliveries, returns, karya, ratings, disputes, audit_logs: [] };
}
