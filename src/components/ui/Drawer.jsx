import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';

/** Side panel for record details; slides in from the inline-end edge (left in RTL). */
export default function Drawer({ open, title, closeLabel, onClose, children }) {
  const closeRef = useRef(null);
  useEscapeKey(open, onClose);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer__header">
          <h2>{title}</h2>
          <button ref={closeRef} type="button" className="icon-btn" aria-label={closeLabel} onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
}
