import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastRegion from '../components/ui/ToastRegion.jsx';

const TOAST_DURATION_MS = 3500;
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
