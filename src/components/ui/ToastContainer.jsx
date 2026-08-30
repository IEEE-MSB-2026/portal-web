import React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'var(--color-success)';
      case 'error':
        return 'var(--color-danger)';
      case 'warning':
        return 'var(--color-accent)';
      case 'info':
      default:
        return 'var(--color-primary)';
    }
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
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bento-card toast-item"
          style={{
            pointerEvents: 'auto',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            borderLeft: `4px solid ${getBorderColor(toast.type)}`,
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: 'var(--color-card)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-md)',
            animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ marginTop: '0.125rem' }}>{getToastIcon(toast.type)}</div>
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
      ))}

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
