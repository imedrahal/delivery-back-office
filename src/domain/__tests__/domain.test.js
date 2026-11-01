import { describe, expect, it } from 'vitest';
import { applyStatusChange } from '../adminActions.js';
import { applyQuery } from '../listQuery.js';
import { averageRating } from '../ratings.js';
import { computeDashboardStats } from '../stats.js';
import { allowedTargets, canTransition, validateTransition } from '../transitions.js';
import { dictionaries } from '../../i18n/index.js';
import { translate } from '../../i18n/translate.js';
import { createSeedDb } from '../../data/seed.js';
import { initials } from '../format.js';
import { recentActivity } from '../stats.js';

describe('transitions', () => {
  it('forbids moving a delivered parcel back to picked up', () => {
    expect(canTransition('delivery', 'DELIVERED', 'PICKED_UP')).toBe(false);
    expect(allowedTargets('delivery', 'DELIVERED')).toEqual([]);
  });
  it('requires a reason and a decision note for dispute resolution', () => {
    expect(validateTransition({ entity: 'dispute', from: 'UNDER_REVIEW', to: 'RESOLVED', reason: '' })).toBe('REASON_REQUIRED');
    expect(validateTransition({ entity: 'dispute', from: 'UNDER_REVIEW', to: 'RESOLVED', reason: 'checked' })).toBe('DECISION_NOTE_REQUIRED');
    expect(validateTransition({ entity: 'dispute', from: 'UNDER_REVIEW', to: 'RESOLVED', reason: 'checked', note: 'done' })).toBeNull();
  });
  it('rejects invalid transitions', () => {
    expect(validateTransition({ entity: 'karya', from: 'COMPLETED', to: 'CANCELLED', reason: 'x'.repeat(5) })).toBe('INVALID_TRANSITION');
  });
});

describe('applyStatusChange', () => {
  it('is pure and appends an audited event', () => {
    const item = { id: 'a', status: 'OPEN', events: [] };
    const next = applyStatusChange(item, { to: 'UNDER_REVIEW', actorId: 'adm', actorName: 'Admin', reason: 'review', now: '2026-10-31T10:00:00.000Z' });
    expect(item.status).toBe('OPEN');
    expect(next.status).toBe('UNDER_REVIEW');
    expect(next.events).toHaveLength(1);
    expect(next.events[0]).toMatchObject({ from_status: 'OPEN', to_status: 'UNDER_REVIEW', reason: 'review' });
  });
});

describe('listQuery', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Item ${i}`, status: i % 2 ? 'A' : 'B', created_at: String(i).padStart(2, '0') }));
  it('filters, searches, sorts and paginates', () => {
    const result = applyQuery(items, { searchFields: ['name'], filters: { status: 'A' }, page: 2, pageSize: 5 });
    expect(result.total).toBe(12);
    expect(result.totalPages).toBe(3);
    expect(result.items).toHaveLength(5);
    expect(applyQuery(items, { search: 'item 24', searchFields: ['name'] }).items).toHaveLength(1);
  });
});

describe('ratings and stats', () => {
  it('ignores hidden ratings in the average', () => {
    const ratings = [
      { score: 5, moderation_status: 'VISIBLE' }, { score: 3, moderation_status: 'VISIBLE' }, { score: 1, moderation_status: 'HIDDEN' },
    ];
    expect(averageRating(ratings)).toEqual({ average: 4, count: 2 });
    expect(averageRating([])).toEqual({ average: null, count: 0 });
  });
  it('computes dashboard counters from seed data', () => {
    const stats = computeDashboardStats(createSeedDb(Date.UTC(2026, 9, 31)));
    expect(Object.values(stats).every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
  });
});

describe('i18n', () => {
  it('keeps the same keys in every locale', () => {
    const reference = Object.keys(dictionaries.en).sort();
    expect(Object.keys(dictionaries.fr).sort()).toEqual(reference);
    expect(Object.keys(dictionaries.ar).sort()).toEqual(reference);
  });
  it('interpolates params and falls back to English', () => {
    expect(translate(dictionaries, 'fr', 'common.page', { page: 2, total: 5 })).toBe('Page 2 sur 5');
    expect(translate({ en: { k: 'hello' }, fr: {} }, 'fr', 'k')).toBe('hello');
  });
});

describe('initials', () => {
  it('returns up to two uppercase initials', () => {
    expect(initials('Amine Ben Salah')).toBe('AB');
    expect(initials('  admin ')).toBe('A');
    expect(initials(undefined)).toBe('');
  });
});

describe('recentActivity', () => {
  it('returns the newest events first, capped by the limit', () => {
    const feed = recentActivity(createSeedDb(Date.UTC(2026, 9, 31)), 5);
    expect(feed).toHaveLength(5);
    const dates = feed.map((e) => e.created_at);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
