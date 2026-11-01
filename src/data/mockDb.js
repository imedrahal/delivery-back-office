import { replaceById } from '../domain/adminActions.js';
import { createSeedDb } from './seed.js';

// Single in-memory store. Swapped for real HTTP calls once the Express API exists.
let db = createSeedDb();

export const getDb = () => db;
export const resetDb = (seed = createSeedDb()) => { db = seed; };

export function commit(collection, item, auditLog) {
  db = {
    ...db,
    [collection]: replaceById(db[collection], item),
    audit_logs: [...db.audit_logs, auditLog],
  };
}
