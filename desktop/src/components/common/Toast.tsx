import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Trash2, Info, X, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 3500;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isDanger = toast.type === 'danger';
  const isError = toast.type === 'error';

  let borderColor = 'rgba(59, 130, 246, 0.4)';
  let glowColor = 'rgba(59, 130, 246, 0.25)';
  let iconColor = '#60a5fa';
  let iconBg = 'rgba(59, 130, 246, 0.14)';
  let iconBorder = 'rgba(59, 130, 246, 0.28)';
  let badgeText = 'NOTICE';
  let badgeColor = '#60a5fa';
  let badgeBg = 'rgba(59, 130, 246, 0.12)';
  let progressGradient = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
  let Icon = Info;

  if (isSuccess) {
    borderColor = 'rgba(16, 185, 129, 0.45)';
    glowColor = 'rgba(16, 185, 129, 0.22)';
    iconColor = '#10b981';
    iconBg = 'rgba(16, 185, 129, 0.14)';
    iconBorder = 'rgba(16, 185, 129, 0.3)';
    badgeText = 'SAVED';
    badgeColor = '#34d399';
    badgeBg = 'rgba(16, 185, 129, 0.12)';
    progressGradient = 'linear-gradient(90deg, #10b981, #34d399)';
    Icon = CheckCircle2;
  } else if (isDanger) {
    borderColor = 'rgba(244, 63, 94, 0.5)';
    glowColor = 'rgba(244, 63, 94, 0.25)';
    iconColor = '#f43f5e';
    iconBg = 'rgba(244, 63, 94, 0.14)';
    iconBorder = 'rgba(244, 63, 94, 0.3)';
    badgeText = 'CLEARED';
    badgeColor = '#fb7185';
    badgeBg = 'rgba(244, 63, 94, 0.12)';
    progressGradient = 'linear-gradient(90deg, #f43f5e, #fb7185)';
    Icon = Trash2;
  } else if (isError) {
    borderColor = 'rgba(239, 68, 68, 0.5)';
    glowColor = 'rgba(239, 68, 68, 0.25)';
    iconColor = '#ef4444';
    iconBg = 'rgba(239, 68, 68, 0.14)';
    iconBorder = 'rgba(239, 68, 68, 0.3)';
    badgeText = 'ALERT';
    badgeColor = '#f87171';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    progressGradient = 'linear-gradient(90deg, #ef4444, #f87171)';
    Icon = AlertCircle;
  }

  return (
    <div
      className="founder-os-toast-card"
      style={{
        pointerEvents: 'auto',
        position: 'relative',
        backgroundColor: 'rgba(10, 15, 28, 0.94)',
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '16px 18px',
        boxShadow: `0 20px 45px -10px rgba(0, 0, 0, 0.85), 0 0 24px -4px ${glowColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
        {/* Left Icon */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            backgroundColor: iconBg,
            border: `1px solid ${iconBorder}`,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.25px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {toast.title}
            </div>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: badgeBg,
                color: badgeColor,
                border: `1px solid ${borderColor}`,
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {badgeText}
            </span>
          </div>

          {toast.message && (
            <div
              style={{
                fontSize: '12.5px',
                color: '#94a3b8',
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              {toast.message}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            padding: '5px',
            borderRadius: '7px',
            color: '#64748b',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background-color 0.15s ease',
            flexShrink: 0,
            marginTop: '-2px',
            marginRight: '-4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Animated shrinking progress line at bottom */}
      {duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            className="founder-os-toast-progress"
            style={{
              height: '100%',
              background: progressGradient,
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, type, title, message, duration };
    setToasts((prev) => [...prev.slice(-3), newToast]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <style>{`
              @keyframes toastSlideInRight {
                0% {
                  opacity: 0;
                  transform: translateX(45px) scale(0.96);
                }
                100% {
                  opacity: 1;
                  transform: translateX(0) scale(1);
                }
              }
              @keyframes toastProgressCountdown {
                0% {
                  width: 100%;
                }
                100% {
                  width: 0%;
                }
              }
              .founder-os-toast-card {
                animation: toastSlideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .founder-os-toast-progress {
                animation: toastProgressCountdown linear forwards;
              }
            `}</style>
            <div
              style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none',
                maxWidth: '440px',
                width: 'calc(100vw - 48px)',
              }}
            >
              {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
              ))}
            </div>
          </>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
