import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue.js';

/**
 * Server-style list state: search, filters and page live here; fetching is delegated
 * to `fetcher({ search, filters, page })` (must be a stable reference).
 */
export function usePaginatedList(fetcher) {
  const [search, setSearchValue] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    fetcher({ search: debouncedSearch, filters, page })
      .then((data) => !cancelled && setState({ status: 'success', data, error: null }))
      .catch((error) => !cancelled && setState({ status: 'error', data: null, error }));
    return () => { cancelled = true; };
  }, [fetcher, debouncedSearch, filters, page, version]);

  const setSearch = useCallback((value) => { setSearchValue(value); setPage(1); }, []);
  const setFilter = useCallback((key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); }, []);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { search, filters, page, state, setSearch, setFilter, setPage, reload };
}
