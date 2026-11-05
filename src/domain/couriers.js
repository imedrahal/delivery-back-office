// Pure helpers for courier (livreur) management. No I/O: ids and dates are injected.
export const VEHICLES = ['MOTO', 'BIKE', 'CAR', 'VAN'];
export const EMPTY_COURIER = { display_name: '', phone: '', email: '', vehicle: 'MOTO', zone: '' };

export const isCourier = (user) => user.roles.includes('courier');
export const courierCapability = (user) => user.capabilities.find((c) => c.capability === 'courier');
export const hasErrors = (errors) => Object.keys(errors).length > 0;

/** Returns { field: errorCode }. Codes map to i18n keys `error.<CODE>`. */
export function validateCourier(input) {
  const errors = {};
  if (input.display_name.trim().length < 2) errors.display_name = 'COURIER_NAME_REQUIRED';
  if (!/^\+?[\d\s.-]{8,}$/.test(input.phone.trim())) errors.phone = 'COURIER_PHONE_INVALID';
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.email = 'COURIER_EMAIL_INVALID';
  if (!input.zone.trim()) errors.zone = 'COURIER_ZONE_REQUIRED';
  return errors;
}

export const isEmailTaken = (users, email) => users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

export const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

export function buildCourierUser(input, { id, now, language = 'fr' }) {
  return {
    id,
    display_name: input.display_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    preferred_language: language,
    account_status: 'ACTIVE',
    roles: ['customer', 'courier'],
    capabilities: [{ capability: 'courier', status: 'APPROVED' }],
    courier_profile: { vehicle: input.vehicle, zone: input.zone.trim() },
    created_at: now, updated_at: now, events: [],
  };
}

export function courierStats(users) {
  const statuses = users.filter(isCourier).map((u) => courierCapability(u)?.status);
  const count = (s) => statuses.filter((x) => x === s).length;
  return { total: statuses.length, approved: count('APPROVED'), pending: count('PENDING'), suspended: count('SUSPENDED') };
}
