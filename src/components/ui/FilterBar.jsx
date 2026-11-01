import Icon from './Icon.jsx';

/** filters: [{ key, label, options: [{ value, label }] }] */
export default function FilterBar({ search, onSearch, searchPlaceholder, filters, values, onFilter, allLabel }) {
  return (
    <div className="filter-bar">
      <div className="search">
        <Icon name="search" size={18} />
        <input type="search" value={search} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)} />
      </div>
      {filters.map((filter) => (
        <label key={filter.key} className="filter-bar__select">
          <span>{filter.label}</span>
          <select value={values[filter.key] ?? ''} onChange={(e) => onFilter(filter.key, e.target.value)}>
            <option value="">{allLabel}</option>
            {filter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
