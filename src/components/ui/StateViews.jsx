import Button from './Button.jsx';

export const LoadingState = ({ label }) => <div className="state state--loading" role="status"><span className="spinner" aria-hidden="true" />{label}</div>;
export const EmptyState = ({ label }) => <p className="state state--empty">{label}</p>;
export const ErrorState = ({ message, retryLabel, onRetry }) => (
  <div className="state state--error" role="alert">
    <p>{message}</p>
    <Button onClick={onRetry}>{retryLabel}</Button>
  </div>
);
