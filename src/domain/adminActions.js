// Pure reducers for audited admin actions. No I/O, no Date.now(): `now` is injected.
const RESOLUTION_TARGETS = ['RESOLVED', 'REJECTED'];

export const replaceById = (list, item) => list.map((existing) => (existing.id === item.id ? item : existing));

const buildEvent = (item, { from, to, actorId, actorName, reason, now }) => ({
  id: `${item.id}-ev-${(item.events?.length ?? 0) + 1}`,
  actor_user_id: actorId,
  actor_name: actorName,
  event_type: 'ADMIN_STATUS_CHANGE',
  from_status: from,
  to_status: to,
  reason,
  created_at: now,
});

export function applyStatusChange(item, { field = 'status', to, actorId, actorName, reason, note, isInternalNote = false, now }) {
  const from = item[field];
  const next = {
    ...item,
    [field]: to,
    updated_at: now,
    events: [...(item.events ?? []), buildEvent(item, { from, to, actorId, actorName, reason, now })],
  };
  if (!note) return next;
  const resolution = RESOLUTION_TARGETS.includes(to) ? { resolved_by: actorId, resolved_at: now } : {};
  return { ...next, decision_note: note.trim(), decision_is_internal: isInternalNote, ...resolution };
}

export function applyProviderStatusChange(user, { capability, to, actorId, actorName, reason, now }) {
  const current = user.capabilities.find((c) => c.capability === capability);
  const capabilities = user.capabilities.map((c) => (c.capability === capability ? { ...c, status: to } : c));
  const event = buildEvent(user, { from: current?.status, to, actorId, actorName, reason, now });
  return { ...user, capabilities, updated_at: now, events: [...(user.events ?? []), event] };
}

export const buildAuditLog = ({ id, actorId, action, entityType, entityId, reason, before, after, now }) => ({
  id,
  actor_user_id: actorId,
  action,
  entity_type: entityType,
  entity_id: entityId,
  reason,
  before_data: before,
  after_data: after,
  created_at: now,
});
