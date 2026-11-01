import Button from './Button.jsx';
import Icon from './Icon.jsx';

export const LoadingState = ({ label, rows = 6 }) => (
  <div className="skeleton" role="status" aria-label={label}>
    {Array.from({ length: rows }, (_, i) => <span key={i} />)}
    <span className="sr-only">{label}</span>
  </div>
);
export const EmptyState = ({ label }) => (
  <div className="state"><Icon name="inbox" size={32} /><p>{label}</p></div>
);
export const ErrorState = ({ message, retryLabel, onRetry }) => (
  <div className="state state--error" role="alert">
    <Icon name="alert" size={32} />
    <p>{message}</p>
    <Button onClick={onRetry}>{retryLabel}</Button>
  </div>
);
