export const getPath = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);
const normalize = (value) => String(value ?? '').toLowerCase();

export function matchesSearch(item, search, fields) {
  const needle = normalize(search).trim();
  if (!needle) return true;
  return fields.some((field) => normalize(getPath(item, field)).includes(needle));
}

export function matchesFilters(item, filters) {
  return Object.entries(filters).every(([key, expected]) => {
    if (expected === '' || expected == null) return true;
    const actual = getPath(item, key);
    return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
  });
}

export function sortItems(items, { field = 'created_at', direction = 'desc' } = {}) {
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const [x, y] = [getPath(a, field), getPath(b, field)];
    if (x === y) return 0;
    return (x > y ? 1 : -1) * factor;
  });
}

export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page: safePage, pageSize, totalPages };
}

/** search + filters + sort + pagination in one pure pipeline (mirrors server-side behaviour). */
export function applyQuery(items, { search = '', searchFields = [], filters = {}, sort, page = 1, pageSize = 10 } = {}) {
  const filtered = items.filter((item) => matchesSearch(item, search, searchFields) && matchesFilters(item, filters));
  return paginate(sortItems(filtered, sort), page, pageSize);
}
