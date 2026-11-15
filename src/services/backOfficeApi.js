// User directories and account actions use the Livra API outside demo mode; other resources remain local.
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
  deliveries: ['reference', 'customer_name', 'courier_name', 'recipient_name', 'pickup_address', 'destination_address', 'parcel_description'],
  returns: ['id', 'reference', 'original_delivery_ref', 'customer_name', 'courier_name'],
  karya: ['id', 'reference', 'customer_name', 'provider_name', 'description'],
  disputes: ['id', 'reference', 'job_ref', 'opened_by_name', 'description'],
  ratings: ['provider_name'],
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

async function requestApi(path, { body, token, method } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
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

function getAdminToken() {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    throw new ApiError('UNAUTHORIZED', 401);
  }
  if (session?.user?.role !== 'admin' || !session.accessToken || session.isDemoSession) {
    throw new ApiError('UNAUTHORIZED', 401);
  }
  return session.accessToken;
}

async function fetchAllApiItems(path, token) {
  const items = [];
  let offset = 0;
  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const result = await requestApi(`${path}${separator}limit=${API_PAGE_SIZE}&offset=${offset}`, { token });
    if (!Array.isArray(result?.items)) throw new ApiError('INVALID_RESPONSE');
    items.push(...result.items);
    if (result.items.length < API_PAGE_SIZE) return items;
    offset += API_PAGE_SIZE;
  }
}

function mapApiUser(user, provider = null) {
  if (!user?.id || !user.name || !['customer', 'provider'].includes(user.role) || typeof user.active !== 'boolean') {
    throw new ApiError('INVALID_RESPONSE');
  }
  const isCourier = user.role === 'provider';
  const vehicleTypes = { bicycle: 'BIKE', motorcycle: 'MOTO', car: 'CAR', van: 'VAN', truck: 'TRUCK' };
  const providerInfo = provider?.provider ?? user.provider;
  return {
    id: user.id,
    display_name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    roles: isCourier ? ['customer', 'courier'] : ['customer'],
    account_status: user.active ? 'ACTIVE' : 'DEACTIVATED',
    preferred_language: null,
    rating: { average: user.ratingAvg ?? null, count: user.ratingCount ?? 0 },
    capabilities: isCourier ? [{ capability: 'courier', status: String(user.approvalStatus ?? 'approved').toUpperCase() }] : [],
    courier_profile: isCourier && providerInfo ? {
      vehicle: vehicleTypes[providerInfo.vehicleType] ?? providerInfo.vehicleType?.toUpperCase(),
      vehicle_plate: providerInfo.vehiclePlate ?? null,
      vehicle_description: providerInfo.vehicleDescription ?? null,
      license_number: providerInfo.licenseNumber ?? null,
      license_uploaded: providerInfo.licenseUploaded ?? false,
      license_photo_url: provider?.licensePhotoUrl ?? null,
    } : null,
    created_at: user.createdAt,
    updated_at: user.createdAt,
    events: [],
  };
}

async function listApiUsers(query = {}) {
  const token = getAdminToken();
  const isCourierList = query.filters?.roles === 'courier';
  const role = isCourierList ? 'provider' : 'customer';
  const params = new URLSearchParams({ role });
  if (query.search?.trim()) params.set('q', query.search.trim());

  const [users, providers] = await Promise.all([
    fetchAllApiItems(`/admin/users?${params}`, token),
    isCourierList ? fetchAllApiItems('/admin/providers', token) : Promise.resolve([]),
  ]);
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const mappedUsers = users.map((user) => mapApiUser(user, providerById.get(user.id)));
  const filters = { ...query.filters };
  delete filters.roles;
  return applyQuery(mappedUsers, {
    pageSize: query.pageSize ?? PAGE_SIZE,
    ...query,
    filters,
    searchFields: ['display_name', 'email'],
  });
}

const DELIVERY_STATUS_MAP = {
  requested: 'OPEN_FOR_COURIERS',
  accepted: 'ASSIGNED',
  picked_up: 'PICKED_UP',
  delivered: 'DELIVERED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
};

function mapApiDelivery(delivery) {
  if (!delivery?.id || !delivery.ref || !DELIVERY_STATUS_MAP[delivery.status]) {
    throw new ApiError('INVALID_RESPONSE');
  }
  const hasActivePreferredOffer = Boolean(
    delivery.status === 'requested'
    && delivery.preferredCourier
    && delivery.exclusiveUntil
    && new Date(delivery.exclusiveUntil).getTime() > Date.now(),
  );
  return {
    id: delivery.id,
    reference: delivery.ref,
    status: hasActivePreferredOffer ? 'OPEN_FOR_PREFERRED_COURIER' : DELIVERY_STATUS_MAP[delivery.status],
    customer_id: delivery.customer?.id ?? null,
    customer_name: delivery.customer?.name ?? null,
    customer_phone: delivery.customer?.phone ?? null,
    assigned_courier_id: delivery.courier?.id ?? null,
    courier_name: delivery.courier?.name ?? null,
    courier_phone: delivery.courier?.phone ?? null,
    preferred_courier_id: delivery.preferredCourier?.id ?? null,
    preferred_courier_name: delivery.preferredCourier?.name ?? null,
    preferred_offer_expires_at: delivery.exclusiveUntil,
    pickup_address: delivery.pickupAddress,
    destination_address: delivery.destinationAddress,
    recipient_name: delivery.recipientName,
    recipient_phone: delivery.recipientPhone,
    parcel_description: delivery.parcelDescription,
    cod_amount: delivery.codAmount,
    courier_fee: delivery.courierFee,
    delivered_at: delivery.deliveredAt,
    settled_at: delivery.settledAt,
    failure_reason: delivery.failureReason,
    created_at: delivery.createdAt,
    updated_at: delivery.updatedAt,
    events: Array.isArray(delivery.history) ? delivery.history.map((event, index) => ({
      id: `${delivery.id}-event-${index}`,
      to_status: DELIVERY_STATUS_MAP[event.status] ?? String(event.status).toUpperCase(),
      created_at: event.at,
      actor_name: null,
      reason: event.note,
    })) : [],
  };
}

async function listApiDeliveries(query = {}) {
  const token = getAdminToken();
  const params = new URLSearchParams();
  const apiStatus = Object.entries(DELIVERY_STATUS_MAP)
    .find(([, frontendStatus]) => frontendStatus === query.filters?.status)?.[0]
    ?? (query.filters?.status === 'OPEN_FOR_PREFERRED_COURIER' ? 'requested' : null);
  if (apiStatus) params.set('status', apiStatus);
  const queryString = params.toString();
  const deliveries = await fetchAllApiItems(queryString ? `/deliveries?${queryString}` : '/deliveries', token);
  const filters = { ...query.filters };
  return applyQuery(deliveries.map(mapApiDelivery), {
    pageSize: query.pageSize ?? PAGE_SIZE,
    ...query,
    filters,
    searchFields: SEARCH_FIELDS.deliveries,
  });
}

export async function getDeliveryDetails(id) {
  if (USE_DEMO_BACKEND) {
    await delay();
    const delivery = getDb().deliveries.find((item) => item.id === id);
    if (!delivery) throw new ApiError('NOT_FOUND', 404);
    return delivery;
  }
  const delivery = await requestApi(`/deliveries/${encodeURIComponent(id)}`, { token: getAdminToken() });
  return mapApiDelivery(delivery);
}

function mapCourierRating(provider) {
  if (!provider?.id || !provider.name || provider.role !== 'provider') {
    throw new ApiError('INVALID_RESPONSE');
  }
  const score = provider.ratingAvg == null ? null : Number(provider.ratingAvg);
  const count = Number(provider.ratingCount ?? 0);
  if ((score !== null && !Number.isFinite(score)) || !Number.isInteger(count) || count < 0) {
    throw new ApiError('INVALID_RESPONSE');
  }
  return {
    id: provider.id,
    provider_id: provider.id,
    provider_name: provider.name,
    score,
    rating_count: count,
    approval_status: String(provider.approvalStatus ?? 'approved').toUpperCase(),
    account_status: provider.active === false ? 'DEACTIVATED' : 'ACTIVE',
    created_at: provider.createdAt,
  };
}

async function listApiCourierRatings(query = {}) {
  const token = getAdminToken();
  const params = new URLSearchParams({ role: 'provider' });
  if (query.search?.trim()) params.set('q', query.search.trim());
  const users = await fetchAllApiItems(`/admin/users?${params}`, token);
  return applyQuery(users.map(mapCourierRating), {
    pageSize: query.pageSize ?? PAGE_SIZE,
    ...query,
    filters: {},
    searchFields: SEARCH_FIELDS.ratings,
  });
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
  if (collection === 'deliveries' && !USE_DEMO_BACKEND) return listApiDeliveries(query);
  if (collection === 'ratings' && !USE_DEMO_BACKEND) return listApiCourierRatings(query);
  if (collection === 'users' && !USE_DEMO_BACKEND) return listApiUsers(query);

  await delay();
  const db = getDb();
  let items = ENRICHERS[collection]?.(db[collection], db) ?? db[collection];
  if (collection === 'ratings') {
    items = db.users.flatMap((user) => {
      const capability = user.capabilities.find((entry) => entry.capability === 'courier');
      if (!capability) return [];
      const userRatings = db.ratings.filter((rating) => rating.provider_id === user.id);
      const rating = averageRating(userRatings);
      return [{
        id: user.id,
        provider_id: user.id,
        provider_name: user.display_name,
        score: rating.average,
        rating_count: rating.count,
        approval_status: capability.status,
        account_status: user.account_status,
        created_at: user.created_at,
      }];
    });
  }
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
  if (entity === 'account' && !USE_DEMO_BACKEND) {
    const token = getAdminToken();
    const active = to === 'ACTIVE';
    const result = await requestApi(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { active },
      token,
    });
    if (result?.id !== id || result.active !== active) throw new ApiError('INVALID_RESPONSE');
    return { id, active, account_status: active ? 'ACTIVE' : 'DEACTIVATED' };
  }

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
