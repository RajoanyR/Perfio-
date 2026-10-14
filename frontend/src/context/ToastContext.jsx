import { createContext, useCallback, useContext, useState } from 'react';
import Icon from '../components/Icon.jsx';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const afficher = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ succes: (m) => afficher(m, 'success'), erreur: (m) => afficher(m, 'danger'), info: (m) => afficher(m, 'info') }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'danger' ? 'alert' : 'check'} size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
