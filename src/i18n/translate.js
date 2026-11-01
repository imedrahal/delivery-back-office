/** Pure translation lookup: locale → English → key. Supports {param} interpolation. */
export function translate(dictionaries, locale, key, params = {}) {
  const template = dictionaries[locale]?.[key] ?? dictionaries.en?.[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (params[name] ?? match));
}
