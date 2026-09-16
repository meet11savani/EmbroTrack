import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 no-print">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in flex items-center gap-3 rounded-xl bg-navy px-4 py-3 shadow-card-lg min-w-[280px] max-w-[400px]"
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-success flex-shrink-0" />}
          {toast.type === 'error' && <XCircle size={18} className="text-danger flex-shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="text-info flex-shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle size={18} className="text-warning flex-shrink-0" />}
          <span className="text-sm text-cream-100 flex-1">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-navy-200 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
