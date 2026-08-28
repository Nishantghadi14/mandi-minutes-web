import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function ToastProvider({ children }) {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
  const colors = {
    success: 'border-mandi-green text-mandi-green',
    error: 'border-red-500 text-red-400',
    warning: 'border-yellow-500 text-yellow-400',
    info: 'border-blue-500 text-blue-400'
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <div key={toast.id} className={`toast-enter pointer-events-auto flex items-center gap-3 bg-mandi-card border-l-4 ${colors[toast.type]} px-4 py-3 rounded-xl shadow-card min-w-[280px] max-w-sm`}>
              <Icon size={18} className="flex-shrink-0" />
              <p className="text-mandi-text text-sm flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-mandi-subtle hover:text-mandi-text transition-colors"><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export const useToast = () => {
  const addToast = useToastStore(state => state.addToast);
  return { addToast };
};
