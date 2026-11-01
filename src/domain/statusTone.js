const TONES = {
  success: ['DELIVERED', 'COMPLETED', 'APPROVED', 'RESOLVED', 'RETURNED', 'ACTIVE', 'VISIBLE', 'SELECTED', 'ACCEPTED'],
  danger: ['FAILED', 'CANCELLED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED', 'HIDDEN', 'NOT_SELECTED', 'WITHDRAWN'],
  warning: ['PENDING', 'RETURN_REQUESTED', 'OPEN', 'UNDER_REVIEW', 'OPEN_FOR_PREFERRED_COURIER'],
};

export function toneFor(status) {
  const found = Object.entries(TONES).find(([, list]) => list.includes(status));
  return found ? found[0] : 'info';
}
