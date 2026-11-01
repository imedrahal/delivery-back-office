// Admin-allowed transitions per entity. The backend remains the source of truth:
// this mirrors section 14 of the spec so the UI only offers valid actions.
export const ADMIN_TRANSITIONS = {
  delivery: {
    OPEN_FOR_PREFERRED_COURIER: ['OPEN_FOR_COURIERS', 'CANCELLED'],
    OPEN_FOR_COURIERS: ['CANCELLED'],
    ASSIGNED: ['OPEN_FOR_COURIERS', 'CANCELLED'],
    PICKED_UP: ['DELIVERED', 'FAILED'],
    DELIVERED: [],
    FAILED: [],
    CANCELLED: [],
  },
  return: {
    RETURN_REQUESTED: ['APPROVED', 'REJECTED'],
    APPROVED: ['OPEN_FOR_COURIERS', 'CANCELLED'],
    REJECTED: [],
    OPEN_FOR_PREFERRED_COURIER: ['OPEN_FOR_COURIERS', 'CANCELLED'],
    OPEN_FOR_COURIERS: ['CANCELLED'],
    ASSIGNED: ['OPEN_FOR_COURIERS', 'CANCELLED'],
    RETURN_PICKED_UP: ['RETURNED', 'CANCELLED'],
    RETURNED: [],
    CANCELLED: [],
  },
  karya: {
    OPEN_FOR_QUOTES: ['CANCELLED'],
    PROVIDER_SELECTED: ['CANCELLED'],
    ACCEPTED: ['CANCELLED'],
    IN_PROGRESS: ['CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  },
  dispute: {
    OPEN: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['RESOLVED', 'REJECTED'],
    RESOLVED: ['CLOSED'],
    REJECTED: ['CLOSED'],
    CLOSED: [],
  },
  provider: {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['SUSPENDED'],
    SUSPENDED: ['APPROVED'],
    REJECTED: ['APPROVED'],
  },
  account: { ACTIVE: ['DEACTIVATED'], DEACTIVATED: ['ACTIVE'] },
  rating: { VISIBLE: ['HIDDEN'], HIDDEN: ['VISIBLE'] },
};

const DECISION_TARGETS = ['RESOLVED', 'REJECTED'];
const MIN_REASON_LENGTH = 3;

export const allowedTargets = (entity, from) => ADMIN_TRANSITIONS[entity]?.[from] ?? [];
export const canTransition = (entity, from, to) => allowedTargets(entity, from).includes(to);
export const requiresDecisionNote = (entity, to) => entity === 'dispute' && DECISION_TARGETS.includes(to);
export const isFilled = (value, min = MIN_REASON_LENGTH) => typeof value === 'string' && value.trim().length >= min;

/** Client-side form check: returns { reason?, note? } error codes. */
export function validateActionForm({ reason, note, needsNote }) {
  const errors = {};
  if (!isFilled(reason)) errors.reason = 'REASON_REQUIRED';
  if (needsNote && !isFilled(note)) errors.note = 'DECISION_NOTE_REQUIRED';
  return errors;
}

/** Full check used by the (mock) API: returns an error code or null. */
export function validateTransition({ entity, from, to, reason, note }) {
  if (!canTransition(entity, from, to)) return 'INVALID_TRANSITION';
  const formErrors = validateActionForm({ reason, note, needsNote: requiresDecisionNote(entity, to) });
  return formErrors.reason ?? formErrors.note ?? null;
}
