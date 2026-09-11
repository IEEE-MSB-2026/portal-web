import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  // Defined inside component to avoid TDZ issues with module-level const + tree-shaken icons
  const TYPE_CONFIG = {
    success: {
      icon: CheckCircle2,
      iconColor: '#10b981',
      borderColor: '#10b981',
    },
    error: {
      icon: AlertCircle,
      iconColor: '#ef4444',
      borderColor: '#ef4444',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: '#f59e0b',
      borderColor: '#f59e0b',
    },
    info: {
      icon: Info,
      iconColor: 'var(--color-primary)',
      borderColor: 'var(--color-primary)',
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '5.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              borderTop: '1px solid var(--color-border)',
              borderRight: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              borderLeft: `4px solid ${cfg.borderColor}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
              backgroundColor: 'var(--color-surface)',
              animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ marginTop: '0.125rem', flexShrink: 0 }}>
              <Icon size={18} style={{ color: cfg.iconColor }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: toast.message ? '0.125rem' : 0 }}>
                  {toast.title}
                </div>
              )}
              {toast.message && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0.2rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                alignSelf: 'flex-start',
                marginLeft: 'auto',
              }}
            >
              <X size={14} style={{ flexShrink: 0 }} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
