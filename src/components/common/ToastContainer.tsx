import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div 
      id="global-toast-container" 
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-whatsapp shrink-0" />,
          info: <Info className="w-5 h-5 text-gold shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        }[toast.type];

        const borders = {
          success: 'border-emerald-500/40 bg-ink',
          info: 'border-gold bg-ink',
          warning: 'border-amber-500/40 bg-ink',
          error: 'border-rose-500/40 bg-ink'
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border ${borders} shadow-2xl text-cream flex items-start gap-3 animate-in slide-in-from-right-5 fade-in duration-300 backdrop-blur-md`}
          >
            {icons}
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-cream leading-tight">{toast.title}</h5>
              <p className="text-xs text-cream mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-white/40 hover:text-white p-2 rounded-full transition-colors rr-md-state"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
