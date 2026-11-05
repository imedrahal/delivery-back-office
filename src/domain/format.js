import { LOCALE_TAGS } from './constants.js';

const tag = (locale) => LOCALE_TAGS[locale] ?? 'en-GB';

export function formatDateTime(iso, locale) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function formatAmount(amount, locale, currency = 'TND') {
  if (amount == null) return '—';
  return new Intl.NumberFormat(tag(locale), { style: 'currency', currency, minimumFractionDigits: 3 }).format(amount);
}

/** Minutes left on a preferred-courier offer (negative once expired). */
export const offerMinutesLeft = (expiresAtIso, nowMs = Date.now()) =>
  expiresAtIso ? Math.ceil((new Date(expiresAtIso).getTime() - nowMs) / 60_000) : null;
