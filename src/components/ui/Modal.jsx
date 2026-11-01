import Icon from './Icon.jsx';
import { useEscapeKey } from '../../hooks/useEscapeKey.js';

/** Small centered dialog (confirmations, forms). */
export default function Modal({ open, title, closeLabel, onClose, children }) {
  useEscapeKey(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label={closeLabel} onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
