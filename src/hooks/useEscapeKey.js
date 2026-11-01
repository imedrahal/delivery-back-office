import { useEffect } from 'react';

export function useEscapeKey(active, onEscape) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => event.key === 'Escape' && onEscape();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
