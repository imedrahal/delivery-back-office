export const isVisibleRating = (rating) => rating.moderation_status === 'VISIBLE';

/** Provider average is computed from visible ratings only (spec section 7). */
export function averageRating(ratings) {
  const visible = ratings.filter(isVisibleRating);
  if (visible.length === 0) return { average: null, count: 0 };
  const sum = visible.reduce((total, r) => total + r.score, 0);
  return { average: Math.round((sum / visible.length) * 10) / 10, count: visible.length };
}

export const stars = (score) => '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score));
