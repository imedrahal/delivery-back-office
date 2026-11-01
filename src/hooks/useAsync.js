import { useCallback, useEffect, useState } from 'react';

/** Runs a stable async function on mount; exposes { status, data, error, reload }. */
export function useAsync(fn) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    fn()
      .then((data) => !cancelled && setState({ status: 'success', data, error: null }))
      .catch((error) => !cancelled && setState({ status: 'error', data: null, error }));
    return () => { cancelled = true; };
  }, [fn, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
