// Mock API with the same async signatures a real REST client would expose.
// To go live: re-implement these functions with fetch() against /api/v1/admin/*.
import { commit, getDb } from '../data/mockDb.js';
import { applyProviderStatusChange, applyStatusChange, buildAuditLog } from '../domain/adminActions.js';
import { PAGE_SIZE } from '../domain/constants.js';
import { ApiError } from '../domain/errors.js';
import { applyQuery } from '../domain/listQuery.js';
import { averageRating } from '../domain/ratings.js';
import { computeDashboardStats, recentActivity } from '../domain/stats.js';
import { validateTransition } from '../domain/transitions.js';

export const ADMIN = { id: 'adm-001', display_name: 'Admin', email: 'admin@delivery.tn' };
const ADMIN_PASSWORD = 'Admin123!';
const LATENCY_MS = 200;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const SEARCH_FIELDS = {
  users: ['id', 'display_name', 'email', 'phone', 'account_status'],
  deliveries: ['id', 'reference', 'customer_name', 'courier_name', 'recipient_name', 'pickup_address'],
  returns: ['id', 'reference', 'original_delivery_ref', 'customer_name', 'courier_name'],
  karya: ['id', 'reference', 'customer_name', 'provider_name', 'description'],
  disputes: ['id', 'reference', 'job_ref', 'opened_by_name', 'description'],
  ratings: ['id', 'job_ref', 'provider_name', 'customer_name', 'comment'],
};

const ENTITY_CONFIG = {
  delivery: { collection: 'deliveries', field: 'status' },
  return: { collection: 'returns', field: 'status' },
  karya: { collection: 'karya', field: 'status' },
  dispute: { collection: 'disputes', field: 'status' },
  rating: { collection: 'ratings', field: 'moderation_status' },
  account: { collection: 'users', field: 'account_status' },
};

// Derived fields added at read time (e.g. rating summary computed from visible ratings only).
const ENRICHERS = {
  users: (users, db) => users.map((u) => ({ ...u, rating: averageRating(db.ratings.filter((r) => r.provider_id === u.id)) })),
};

export async function login(email, password) {
  await delay();
  if (email.trim().toLowerCase() !== ADMIN.email || password !== ADMIN_PASSWORD) {
    throw new ApiError('INVALID_CREDENTIALS', 401);
  }
  return { user: ADMIN, token: 'mock-access-token' };
}

export async function listResource(collection, query = {}) {
  await delay();
  const db = getDb();
  const items = ENRICHERS[collection]?.(db[collection], db) ?? db[collection];
  return applyQuery(items, { pageSize: PAGE_SIZE, ...query, searchFields: SEARCH_FIELDS[collection] });
}

export async function getDashboardStats() {
  await delay();
  const db = getDb();
  return { ...computeDashboardStats(db), activity: recentActivity(db) };
}

const findOrThrow = (collection, id) => {
  const item = getDb()[collection].find((entry) => entry.id === id);
  if (!item) throw new ApiError('NOT_FOUND', 404);
  return item;
};

const auditId = () => `audit-${getDb().audit_logs.length + 1}`;

export async function changeStatus(entity, id, { to, reason, note, isInternalNote }) {
  await delay();
  const { collection, field } = ENTITY_CONFIG[entity];
  const item = findOrThrow(collection, id);
  const code = validateTransition({ entity, from: item[field], to, reason, note });
  if (code) throw new ApiError(code, code === 'INVALID_TRANSITION' ? 409 : 422);

  const now = new Date().toISOString();
  const updated = applyStatusChange(item, { field, to, actorId: ADMIN.id, actorName: ADMIN.display_name, reason, note, isInternalNote, now });
  commit(collection, updated, buildAuditLog({
    id: auditId(), actorId: ADMIN.id, action: `${entity}.status_change`, entityType: entity, entityId: id,
    reason, before: { [field]: item[field] }, after: { [field]: to }, now,
  }));
  return updated;
}

export async function changeProviderStatus(userId, capability, { to, reason }) {
  await delay();
  const user = findOrThrow('users', userId);
  const current = user.capabilities.find((c) => c.capability === capability);
  if (!current) throw new ApiError('NOT_FOUND', 404);
  const code = validateTransition({ entity: 'provider', from: current.status, to, reason });
  if (code) throw new ApiError(code, code === 'INVALID_TRANSITION' ? 409 : 422);

  const now = new Date().toISOString();
  const updated = applyProviderStatusChange(user, { capability, to, actorId: ADMIN.id, actorName: ADMIN.display_name, reason, now });
  commit('users', updated, buildAuditLog({
    id: auditId(), actorId: ADMIN.id, action: 'provider.status_change', entityType: `provider:${capability}`, entityId: userId,
    reason, before: { status: current.status }, after: { status: to }, now,
  }));
  return { ...updated, rating: averageRating(getDb().ratings.filter((r) => r.provider_id === userId)) };
}

