import Select from './Select.jsx';

/** filters: [{ key, label, options: [{ value, label }] }] */
export default function FilterBar({ search, onSearch, searchPlaceholder, filters, values, onFilter, allLabel }) {
  return (
    <div className="filter-bar">
      <input type="search" value={search} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
        onChange={(e) => onSearch(e.target.value)} />
      {filters.map((filter) => (
        <label key={filter.key} className="filter-bar__select">
          <span>{filter.label}</span>
          <Select
            label={filter.label}
            value={values[filter.key] ?? ''}
            options={[{ value: '', label: allLabel }, ...filter.options]}
            onChange={(value) => onFilter(filter.key, value)}
          />
        </label>
      ))}
    </div>
  );
}
