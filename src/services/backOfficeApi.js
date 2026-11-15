// Most back-office resources use local demo data; login and dashboard can use the Livra API.
import { commit, getDb, insert } from '../data/mockDb.js';
import { authenticateDemo, getDemoDashboardStats } from '../data/demo.js';
import { applyProviderStatusChange, applyStatusChange, buildAuditLog } from '../domain/adminActions.js';
import { buildCourierUser, courierStats, isEmailTaken, validateCourier } from '../domain/couriers.js';
import { PAGE_SIZE } from '../domain/constants.js';
import { ApiError } from '../domain/errors.js';
import { applyQuery } from '../domain/listQuery.js';
import { averageRating } from '../domain/ratings.js';
import { validateTransition } from '../domain/transitions.js';
import { DEFAULT_API_BASE_URL, USE_DEMO_BACKEND } from '../config/runtime.js';

const LATENCY_MS = 200;
const delay = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
const AUTH_STORAGE_KEY = 'bo_session';
const API_PAGE_SIZE = 100;
const MOCK_ADMIN_ACTOR = { id: 'adm-001', display_name: 'Admin' };

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

async function requestApi(path, { body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error instanceof TypeError) throw new ApiError('NETWORK_ERROR');
    throw error;
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('INVALID_RESPONSE', response.status);
  }
  if (!response.ok) throw new ApiError(result?.code || 'UNKNOWN', response.status);
  return result;
}

export async function login(identifier, password) {
  if (USE_DEMO_BACKEND) return authenticateDemo(identifier, password);

  const result = await requestApi('/auth/login', {
    body: { identifier: identifier.trim(), password },
  });
  if (!result?.user?.id || !result.user.name || !result.user.role || !result.accessToken || !result.refreshToken) {
    throw new ApiError('INVALID_RESPONSE');
  }
  if (result.user.role !== 'admin') throw new ApiError('ADMIN_REQUIRED', 403);

  return {
    ...result,
    user: { ...result.user, display_name: result.user.name },
  };
}

export async function listResource(collection, query = {}) {
  await delay();
  const db = getDb();
  const items = ENRICHERS[collection]?.(db[collection], db) ?? db[collection];
  return applyQuery(items, { pageSize: PAGE_SIZE, ...query, searchFields: SEARCH_FIELDS[collection] });
}

export async function getDashboardStats() {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    throw new ApiError('UNAUTHORIZED', 401);
  }
  if (USE_DEMO_BACKEND) {
    if (session?.user?.role !== 'admin' || !session.isDemoSession) {
      throw new ApiError('UNAUTHORIZED', 401);
    }
    await delay();
    return getDemoDashboardStats(getDb());
  }

  if (session?.user?.role !== 'admin' || !session.accessToken) {
    throw new ApiError('UNAUTHORIZED', 401);
  }

  const token = session.accessToken;
  const countByStatus = async (resource, status) => {
    let count = 0;
    let offset = 0;
    while (true) {
      const result = await requestApi(
        `/${resource}?status=${encodeURIComponent(status)}&limit=${API_PAGE_SIZE}&offset=${offset}`,
        { token },
      );
      if (!Array.isArray(result?.items)) throw new ApiError('INVALID_RESPONSE');
      count += result.items.length;
      if (result.items.length < API_PAGE_SIZE) return count;
      offset += API_PAGE_SIZE;
    }
  };

  const [openDeliveries, acceptedDeliveries, pickedUpDeliveries, requestedReturns, acceptedReturns, pickedUpReturns, openDisputes, transporters] =
    await Promise.all([
      countByStatus('deliveries', 'requested'),
      countByStatus('deliveries', 'accepted'),
      countByStatus('deliveries', 'picked_up'),
      countByStatus('returns', 'requested'),
      countByStatus('returns', 'accepted'),
      countByStatus('returns', 'picked_up'),
      countByStatus('disputes', 'open'),
      requestApi('/admin/transporters', { token }),
    ]);

  if (!Array.isArray(transporters?.items) || !transporters.items.every((item) => typeof item.active === 'boolean')) {
    throw new ApiError('INVALID_RESPONSE');
  }
  const activeTransporters = transporters.items.filter((item) => item.active).length;

  return {
    openDeliveries,
    activeDeliveries: acceptedDeliveries + pickedUpDeliveries,
    openReturns: requestedReturns + acceptedReturns + pickedUpReturns,
    activeTransporters,
    inactiveTransporters: transporters.items.length - activeTransporters,
    openDisputes,
  };
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
  const updated = applyStatusChange(item, { field, to, actorId: MOCK_ADMIN_ACTOR.id, actorName: MOCK_ADMIN_ACTOR.display_name, reason, note, isInternalNote, now });
  commit(collection, updated, buildAuditLog({
    id: auditId(), actorId: MOCK_ADMIN_ACTOR.id, action: `${entity}.status_change`, entityType: entity, entityId: id,
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
  const updated = applyProviderStatusChange(user, { capability, to, actorId: MOCK_ADMIN_ACTOR.id, actorName: MOCK_ADMIN_ACTOR.display_name, reason, now });
  commit('users', updated, buildAuditLog({
    id: auditId(), actorId: MOCK_ADMIN_ACTOR.id, action: 'provider.status_change', entityType: `provider:${capability}`, entityId: userId,
    reason, before: { status: current.status }, after: { status: to }, now,
  }));
  return { ...updated, rating: averageRating(getDb().ratings.filter((r) => r.provider_id === userId)) };
}


export async function getCourierStats() {
  await delay();
  return courierStats(getDb().users);
}

/** Admin-side creation of a courier account (immediately APPROVED). */
export async function createCourier(input) {
  await delay();
  const firstError = Object.values(validateCourier(input))[0];
  if (firstError) throw new ApiError(firstError, 422);
  const { users } = getDb();
  if (isEmailTaken(users, input.email)) throw new ApiError('EMAIL_TAKEN', 409);
  const now = new Date().toISOString();
  const courier = buildCourierUser(input, { id: `u-${String(users.length + 1).padStart(3, '0')}`, now });
  insert('users', courier, buildAuditLog({
    id: auditId(), actorId: MOCK_ADMIN_ACTOR.id, action: 'courier.create', entityType: 'account', entityId: courier.id,
    reason: null, before: null, after: { roles: courier.roles }, now,
  }));
  return courier;
}
