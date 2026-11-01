import Icon from './Icon.jsx';

export default function ToastRegion({ toasts }) {
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast"><Icon name="check" size={18} /><span>{toast.message}</span></div>
      ))}
    </div>
  );
}
